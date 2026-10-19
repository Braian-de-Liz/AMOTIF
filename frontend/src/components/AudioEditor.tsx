import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Scissors, Volume2, Mic, Square, Loader2, Repeat, ZoomIn, ZoomOut, Maximize2, Headphones, Trash2, Crosshair } from 'lucide-react';
import { openMicStream, recorderOptions } from '../utility/micCapture';
import { useFeedback } from '../contexts/FeedbackContext';
import '../styles/AudioEditor.css';
import {
    applyFades,
    clampSelection,
    concatChannels,
    formatTimePrecise,
    parseTime,
    removeRange,
    sliceChannels,
    zoomToPxPerSec,
    type Channels,
} from '../utility/audioEdit';

interface AudioEditorProps {
    audioBlob?: Blob
    audioUrl?: string
    /** Só um palpite inicial (a duração real vem do áudio decodificado). */
    audioDuration?: number
    onEdited: (blob: Blob) => void
    onBack?: () => void
}

type EditMode = 'keep' | 'remove';

const REGION_COLORS: Record<EditMode, string> = {
    keep: 'rgba(92, 122, 68, 0.28)',
    remove: 'rgba(198, 32, 32, 0.25)',
};

/** Quanto as setas andam no editor, em segundos. */
const SKIP_SECONDS = 1;
const MAX_PX_PER_SEC = 1200;

function encodeWav(audioBuffer: AudioBuffer): Blob {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const samples = audioBuffer.length;
    const dataSize = samples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < samples; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            const sample = Math.max(-1, Math.min(1, channels[ch][i]));
            const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, intSample, true);
            offset += 2;
        }
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

// Gate suave: segue o envelope do sinal e abaixa o ganho com rampa (~5 ms) quando
// ele cai abaixo do limiar. Cortar amostra a amostra gera chiado e distorção.
function applyNoiseGate(buffer: AudioBuffer, amount: number) {
    if (amount <= 0) return;
    const threshold = (amount / 100) * 0.1;
    const floorGain = 1 - amount / 100;
    const sr = buffer.sampleRate;
    const smooth = 1 - Math.exp(-1 / (0.005 * sr));
    const release = Math.exp(-1 / (0.05 * sr));
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));

    let envelope = 0;
    let gain = 1;
    for (let i = 0; i < buffer.length; i++) {
        let level = 0;
        for (const ch of channels) level = Math.max(level, Math.abs(ch[i]));
        envelope = Math.max(level, envelope * release);
        gain += ((envelope < threshold ? floorGain : 1) - gain) * smooth;
        for (const ch of channels) ch[i] *= gain;
    }
}

// Se o ganho/EQ passar de 1.0, reduz tudo proporcionalmente em vez de cortar (clipping).
function normalizeIfClipping(buffer: AudioBuffer) {
    let peak = 0;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    }
    if (peak <= 1) return;
    const scale = 0.98 / peak;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < data.length; i++) data[i] *= scale;
    }
}

interface TimeFieldProps {
    id: string
    label: string
    value: number
    min: number
    max: number
    readOnly?: boolean
    onCommit?: (seconds: number) => void
    /** Botão "usar a posição do cursor". */
    onSetFromPlayhead?: () => void
}

/** Campo de tempo editável: Enter/blur confirma, ↑/↓ ajustam em centésimos (Shift = décimos). */
function TimeField({ id, label, value, min, max, readOnly, onCommit, onSetFromPlayhead }: TimeFieldProps) {
    const [text, setText] = useState(formatTimePrecise(value));
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (!editing) setText(formatTimePrecise(value));
    }, [value, editing]);

    const commit = () => {
        setEditing(false);
        const parsed = parseTime(text);
        if (parsed === null) {
            setText(formatTimePrecise(value));
            return;
        }
        onCommit?.(Math.min(max, Math.max(min, parsed)));
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commit();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const step = (e.shiftKey ? 0.1 : 0.01) * (e.key === 'ArrowUp' ? 1 : -1);
            onCommit?.(Math.min(max, Math.max(min, value + step)));
        }
    };

    return (
        <div className="trim-input-group">
            <label htmlFor={id}>{label}</label>
            <div className="trim-input-row">
                <input
                    id={id}
                    type="text"
                    inputMode="decimal"
                    className="trim-input"
                    value={text}
                    readOnly={readOnly}
                    onFocus={() => setEditing(true)}
                    onChange={e => setText(e.target.value)}
                    onBlur={commit}
                    onKeyDown={onKeyDown}
                    aria-label={`${label} (minutos:segundos.centésimos)`}
                />
                {onSetFromPlayhead && (
                    <button
                        type="button"
                        className="trim-set-btn"
                        onClick={onSetFromPlayhead}
                        title={`${label} = posição do cursor`}
                        aria-label={`Usar posição do cursor como ${label.toLowerCase()}`}
                    >
                        <Crosshair size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

function AudioEditor({ audioBlob, audioUrl, onEdited, onBack }: AudioEditorProps) {
    const feedback = useFeedback();
    const [duration, setDuration] = useState(0);
    const [selStart, setSelStart] = useState(0);
    const [selEnd, setSelEnd] = useState(0);
    const [mode, setMode] = useState<EditMode>('keep');
    const [fadeIn, setFadeIn] = useState(0);
    const [fadeOut, setFadeOut] = useState(0);
    const [zoom, setZoom] = useState(0);
    const [loop, setLoop] = useState(false);
    const [volumeGain, setVolumeGain] = useState(100);
    const [bassGain, setBassGain] = useState(0);
    const [trebleGain, setTrebleGain] = useState(0);
    const [noiseReduction, setNoiseReduction] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [previewState, setPreviewState] = useState<'idle' | 'rendering' | 'playing'>('idle');

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [hasRecording, setHasRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordedDuration, setRecordedDuration] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const wavesurferRef = useRef<any>(null);
    const regionRef = useRef<any>(null);
    const sourceRef = useRef<AudioBuffer | null>(null);
    const clockRef = useRef<HTMLSpanElement | null>(null);
    const loopRef = useRef(false);
    const audioUrlRef = useRef<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedTimeRef = useRef<number>(0);
    const elapsedMsRef = useRef<number>(0);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number>(0);
    const previewWaveSurferRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const previewUrlRef = useRef<string | null>(null);

    useEffect(() => { loopRef.current = loop; }, [loop]);

    const selectionLength = Math.max(0, selEnd - selStart);
    const resultDuration = (mode === 'keep' ? selectionLength : Math.max(0, duration - selectionLength)) + recordedDuration;
    const fitPxPerSec = () => {
        const width = containerRef.current?.clientWidth ?? 0;
        return duration > 0 ? width / duration : 0;
    };

    const formatTimeMs = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // ---------- waveform + régua + seleção arrastável ----------
    useEffect(() => {
        if (!containerRef.current) return;

        let cancelled = false;
        setLoadError(false);

        async function initWaveSurfer() {
            const [{ default: WaveSurferModule }, { default: RegionsPlugin }, { default: TimelinePlugin }] = await Promise.all([
                import('wavesurfer.js'),
                import('wavesurfer.js/plugins/regions'),
                import('wavesurfer.js/plugins/timeline'),
            ]);
            if (cancelled || !containerRef.current) return;

            const url = audioBlob ? URL.createObjectURL(audioBlob) : audioUrl!;
            audioUrlRef.current = url;

            const ws = WaveSurferModule.create({
                container: containerRef.current,
                waveColor: '#7a9f6a',
                progressColor: '#3f5a2c',
                cursorColor: '#8a6a14',
                cursorWidth: 2,
                barWidth: 2,
                barGap: 1,
                barRadius: 3,
                height: 150,
                normalize: true,
                backend: 'WebAudio',
                minPxPerSec: 0,
            });

            const regions = ws.registerPlugin(RegionsPlugin.create());
            ws.registerPlugin(TimelinePlugin.create({
                height: 22,
                style: { fontSize: '11px', color: '#55684c' },
            }));

            ws.load(url);

            ws.on('ready', () => {
                if (cancelled) return;
                const decoded = ws.getDecodedData();
                const total = ws.getDuration();
                sourceRef.current = decoded;
                setDuration(total);
                setSelStart(0);
                setSelEnd(total);

                regionRef.current = regions.addRegion({
                    start: 0,
                    end: total,
                    color: REGION_COLORS.keep,
                    drag: true,
                    resize: true,
                    minLength: 0.05,
                });
            });

            ws.on('error', () => { if (!cancelled) setLoadError(true); });
            ws.on('play', () => { if (!cancelled) setIsPlaying(true); });
            ws.on('pause', () => { if (!cancelled) setIsPlaying(false); });
            ws.on('finish', () => { if (!cancelled) setIsPlaying(false); });
            ws.on('timeupdate', (time: number) => {
                if (clockRef.current) clockRef.current.textContent = formatTimePrecise(time);
            });
            ws.on('interaction', (time: number) => {
                if (clockRef.current) clockRef.current.textContent = formatTimePrecise(time);
            });

            const syncSelection = (region: any) => {
                if (cancelled || region !== regionRef.current) return;
                setSelStart(region.start);
                setSelEnd(region.end);
            };
            regions.on('region-update', syncSelection);
            regions.on('region-updated', syncSelection);
            // Em repetição, ao sair da seleção volta para o começo dela.
            regions.on('region-out', (region: any) => {
                if (!cancelled && loopRef.current && region === regionRef.current) region.play();
            });

            wavesurferRef.current = ws;
        }

        initWaveSurfer();

        return () => {
            cancelled = true;
            regionRef.current = null;
            sourceRef.current = null;
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
            if (audioBlob && audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
            }
        };
    }, [audioBlob, audioUrl]);

    // A seleção digitada/ajustada por botão vai para a região desenhada (e a cor segue o modo).
    useEffect(() => {
        const region = regionRef.current;
        if (!region) return;
        if (region.start !== selStart || region.end !== selEnd) region.setOptions({ start: selStart, end: selEnd });
        region.setOptions({ color: REGION_COLORS[mode] });
    }, [selStart, selEnd, mode]);

    // Zoom: o nível 0 cabe a faixa inteira na largura; 100 chega a MAX_PX_PER_SEC.
    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws || duration <= 0) return;
        const fit = fitPxPerSec();
        ws.zoom(zoom === 0 ? 0 : zoomToPxPerSec(zoom, fit, MAX_PX_PER_SEC));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoom, duration]);

    // Ctrl + roda do mouse aproxima/afasta a forma de onda.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            setZoom(z => Math.min(100, Math.max(0, z + (e.deltaY < 0 ? 5 : -5))));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (previewWaveSurferRef.current) previewWaveSurferRef.current.destroy();
            previewAudioRef.current?.pause();
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        };
    }, []);

    const drawVisualizer = useCallback(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

                const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
                gradient.addColorStop(0, '#5c7a44');
                gradient.addColorStop(1, '#b8d0b0');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

                x += barWidth;
                if (x > canvas.width) break;
            }
        };

        draw();
    }, []);

    const stopVisualizer = useCallback(() => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }, []);

    const startTimer = useCallback(() => {
        startTimeRef.current = Date.now() - pausedTimeRef.current;
        timerRef.current = setInterval(() => {
            const now = Date.now() - startTimeRef.current;
            elapsedMsRef.current = now;
            setElapsedTime(now);
        }, 100);
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // ---------- seleção ----------
    const setSelection = useCallback((start: number, end: number) => {
        const next = clampSelection(start, end, duration);
        setSelStart(next.start);
        setSelEnd(next.end);
    }, [duration]);

    const playheadTime = () => wavesurferRef.current?.getCurrentTime() ?? 0;

    const setStartFromPlayhead = useCallback(() => {
        setSelection(playheadTime(), selEnd > playheadTime() ? selEnd : duration);
    }, [setSelection, selEnd, duration]);

    const setEndFromPlayhead = useCallback(() => {
        setSelection(selStart < playheadTime() ? selStart : 0, playheadTime());
    }, [setSelection, selStart]);

    const selectAll = useCallback(() => setSelection(0, duration), [setSelection, duration]);

    // ---------- reprodução ----------
    const stopResultPreview = useCallback(() => {
        previewAudioRef.current?.pause();
        setPreviewState('idle');
    }, []);

    const togglePlayback = useCallback(() => {
        const ws = wavesurferRef.current;
        if (!ws) return;
        stopResultPreview();
        ws.playPause();
    }, [stopResultPreview]);

    const playSelection = useCallback(() => {
        const region = regionRef.current;
        if (!region) return;
        stopResultPreview();
        region.play();
    }, [stopResultPreview]);

    const seekBy = useCallback((delta: number) => {
        const ws = wavesurferRef.current;
        if (!ws || duration <= 0) return;
        ws.setTime(Math.min(duration, Math.max(0, ws.getCurrentTime() + delta)));
    }, [duration]);

    // Atalhos do editor; não roubam teclas de quem digita nem o Espaço de um botão focado.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const target = e.target instanceof Element ? e.target : null;
            if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
            if (e.key === ' ' && target?.closest('button, a, [role="button"]')) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlayback();
                    break;
                case '[':
                    e.preventDefault();
                    setStartFromPlayhead();
                    break;
                case ']':
                    e.preventDefault();
                    setEndFromPlayhead();
                    break;
                case 'l':
                case 'L':
                    setLoop(v => !v);
                    break;
                case 'Home':
                    e.preventDefault();
                    wavesurferRef.current?.setTime(0);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    seekBy(-SKIP_SECONDS);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    seekBy(SKIP_SECONDS);
                    break;
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [togglePlayback, setStartFromPlayhead, setEndFromPlayhead, seekBy]);

    // ---------- gravação de extensão ----------
    const startRecording = useCallback(async () => {
        try {
            const stream = await openMicStream();
            streamRef.current = stream;

            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            chunksRef.current = [];
            pausedTimeRef.current = 0;
            elapsedMsRef.current = 0;
            setElapsedTime(0);

            const options = recorderOptions();
            const mimeType = options.mimeType;

            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setRecordedBlob(blob);
                setRecordedDuration(elapsedMsRef.current / 1000);
                setHasRecording(true);
                setIsRecording(false);
                setIsPaused(false);
                stopVisualizer();
                stopTimer();

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                }
            };

            recorder.start(100);
            setIsRecording(true);
            setIsPaused(false);
            startTimer();
            drawVisualizer();
        } catch {
            feedback.error('Não foi possível acessar o microfone. Verifique a permissão do navegador.');
        }
    }, [startTimer, stopTimer, drawVisualizer, stopVisualizer, feedback]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            stopTimer();
            stopVisualizer();
        }
    }, [stopTimer, stopVisualizer]);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            startTimer();
            drawVisualizer();
        }
    }, [startTimer, drawVisualizer]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            stopTimer();
        }
    }, [stopTimer]);

    const clearRecording = useCallback(() => {
        setHasRecording(false);
        setRecordedBlob(null);
        setRecordedDuration(0);
        setElapsedTime(0);
        pausedTimeRef.current = 0;
        if (previewWaveSurferRef.current) {
            previewWaveSurferRef.current.destroy();
            previewWaveSurferRef.current = null;
        }
    }, []);

    // ---------- renderização (a mesma para a prévia e para confirmar) ----------
    const renderEdit = useCallback(async (): Promise<Blob> => {
        const source = sourceRef.current;
        if (!source) throw new Error('O áudio ainda está carregando.');

        const sampleRate = source.sampleRate;
        const original: Channels = Array.from({ length: source.numberOfChannels }, (_, c) => source.getChannelData(c));
        const edited = mode === 'keep'
            ? sliceChannels(original, sampleRate, selStart, selEnd)
            : removeRange(original, sampleRate, selStart, selEnd);

        const parts: Channels[] = [edited];
        if (recordedBlob) {
            // O contexto na taxa do original faz o decode reamostrar a extensão para ela.
            const decodeCtx = new AudioContext({ sampleRate });
            try {
                const decoded = await decodeCtx.decodeAudioData(await recordedBlob.arrayBuffer());
                parts.push(Array.from({ length: decoded.numberOfChannels }, (_, c) => decoded.getChannelData(c)));
            } finally {
                decodeCtx.close();
            }
        }

        const merged = concatChannels(parts);
        if (merged[0].length === 0) throw new Error('Não sobrou áudio com essa seleção.');

        const numChannels = merged.length;
        const offlineCtx = new OfflineAudioContext(numChannels, merged[0].length, sampleRate);
        const buffer = offlineCtx.createBuffer(numChannels, merged[0].length, sampleRate);
        merged.forEach((data, c) => buffer.copyToChannel(data as Float32Array<ArrayBuffer>, c));

        // Uma única renderização (um OfflineAudioContext só renderiza uma vez):
        // ganho -> graves -> agudos -> saída.
        const node = offlineCtx.createBufferSource();
        node.buffer = buffer;
        const gainNode = offlineCtx.createGain();
        gainNode.gain.value = volumeGain / 100;
        let tail: AudioNode = node.connect(gainNode);

        if (bassGain !== 0) {
            const bassFilter = offlineCtx.createBiquadFilter();
            bassFilter.type = 'lowshelf';
            bassFilter.frequency.value = 80;
            bassFilter.gain.value = bassGain;
            tail = tail.connect(bassFilter);
        }

        if (trebleGain !== 0) {
            const trebleFilter = offlineCtx.createBiquadFilter();
            trebleFilter.type = 'highshelf';
            trebleFilter.frequency.value = 6000;
            trebleFilter.gain.value = trebleGain;
            tail = tail.connect(trebleFilter);
        }

        tail.connect(offlineCtx.destination);
        node.start();

        const rendered = await offlineCtx.startRendering();
        applyNoiseGate(rendered, noiseReduction);
        applyFades(
            Array.from({ length: rendered.numberOfChannels }, (_, c) => rendered.getChannelData(c)),
            rendered.sampleRate,
            fadeIn,
            fadeOut,
        );
        normalizeIfClipping(rendered);
        return encodeWav(rendered);
    }, [mode, selStart, selEnd, recordedBlob, volumeGain, bassGain, trebleGain, noiseReduction, fadeIn, fadeOut]);

    const handleExport = useCallback(async () => {
        setIsProcessing(true);
        try {
            onEdited(await renderEdit());
        } catch (err) {
            console.error('Erro ao processar áudio:', err);
            feedback.error(err instanceof Error ? err.message : 'Não foi possível processar o áudio.');
        } finally {
            setIsProcessing(false);
        }
    }, [renderEdit, onEdited, feedback]);

    // Ouve o resultado de verdade (corte, fades, EQ, ruído), não só a faixa original.
    const handlePreviewResult = useCallback(async () => {
        if (previewState === 'playing') {
            stopResultPreview();
            return;
        }
        if (previewState === 'rendering') return;

        wavesurferRef.current?.pause();
        setPreviewState('rendering');
        try {
            const blob = await renderEdit();
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
            const url = URL.createObjectURL(blob);
            previewUrlRef.current = url;

            const audio = new Audio(url);
            audio.onended = () => setPreviewState('idle');
            previewAudioRef.current = audio;
            await audio.play();
            setPreviewState('playing');
        } catch (err) {
            setPreviewState('idle');
            feedback.error(err instanceof Error ? err.message : 'Não foi possível gerar a prévia.');
        }
    }, [previewState, renderEdit, stopResultPreview, feedback]);

    const ready = duration > 0;
    const zoomIn = () => setZoom(z => Math.min(100, z + 10));
    const zoomOut = () => setZoom(z => Math.max(0, z - 10));

    return (
        <div className="editor-area">
            <div className="editor-toolbar" role="toolbar" aria-label="Reprodução e zoom">
                <div className="editor-toolbar-group">
                    <button
                        type="button"
                        className="editor-icon-btn primary"
                        onClick={togglePlayback}
                        disabled={!ready}
                        title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'}
                        aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                        type="button"
                        className="editor-icon-btn"
                        onClick={playSelection}
                        disabled={!ready}
                        title="Ouvir só a seleção"
                        aria-label="Ouvir só a seleção"
                    >
                        <Scissors size={16} />
                    </button>
                    <button
                        type="button"
                        className={`editor-icon-btn${loop ? ' active' : ''}`}
                        onClick={() => setLoop(v => !v)}
                        disabled={!ready}
                        title="Repetir a seleção (L)"
                        aria-label="Repetir a seleção"
                        aria-pressed={loop}
                    >
                        <Repeat size={16} />
                    </button>
                    <span className="editor-clock" aria-label="Posição do cursor">
                        <span ref={clockRef}>0:00.00</span>
                        <span className="editor-clock-total"> / {formatTimePrecise(duration)}</span>
                    </span>
                </div>

                <div className="editor-toolbar-group">
                    <button type="button" className="editor-icon-btn" onClick={zoomOut} disabled={!ready || zoom === 0} title="Afastar" aria-label="Afastar">
                        <ZoomOut size={16} />
                    </button>
                    <input
                        type="range"
                        className="editor-range editor-zoom"
                        min={0}
                        max={100}
                        step={1}
                        value={zoom}
                        onChange={e => setZoom(Number(e.target.value))}
                        disabled={!ready}
                        aria-label="Zoom da forma de onda"
                        title="Zoom (Ctrl + roda do mouse)"
                    />
                    <button type="button" className="editor-icon-btn" onClick={zoomIn} disabled={!ready || zoom === 100} title="Aproximar" aria-label="Aproximar">
                        <ZoomIn size={16} />
                    </button>
                    <button type="button" className="editor-icon-btn" onClick={() => setZoom(0)} disabled={!ready || zoom === 0} title="Ajustar à tela" aria-label="Ajustar à tela">
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>

            <div className="editor-waveform-container">
                <div ref={containerRef}></div>
                {!ready && !loadError && <div className="editor-waveform-status">Carregando áudio…</div>}
                {loadError && <div className="editor-waveform-status error">Não foi possível carregar o áudio.</div>}
            </div>
            <p className="editor-hint">
                Arraste as bordas da área colorida para escolher o trecho · clique na onda para posicionar o cursor ·
                <kbd>[</kbd> <kbd>]</kbd> marcam início e fim no cursor · <kbd>Espaço</kbd> toca · <kbd>L</kbd> repete · Ctrl + roda dá zoom
            </p>

            <div className="editor-controls">
                <section className="editor-section" aria-labelledby="editor-sec-selecao">
                <h4 className="editor-section-title" id="editor-sec-selecao">Seleção</h4>
                <div className="editor-mode" role="radiogroup" aria-label="O que fazer com a seleção">
                    <button
                        type="button"
                        role="radio"
                        aria-checked={mode === 'keep'}
                        className={`editor-mode-btn${mode === 'keep' ? ' active' : ''}`}
                        onClick={() => setMode('keep')}
                    >
                        <Scissors size={14} /> Manter só a seleção
                    </button>
                    <button
                        type="button"
                        role="radio"
                        aria-checked={mode === 'remove'}
                        className={`editor-mode-btn remove${mode === 'remove' ? ' active' : ''}`}
                        onClick={() => setMode('remove')}
                    >
                        <Trash2 size={14} /> Remover a seleção
                    </button>
                </div>

                <div className="trim-inputs">
                    <TimeField
                        id="editor-sel-start"
                        label="Início"
                        value={selStart}
                        min={0}
                        max={Math.max(0, selEnd - 0.05)}
                        onCommit={v => setSelection(v, selEnd)}
                        onSetFromPlayhead={setStartFromPlayhead}
                    />
                    <span className="trim-separator">→</span>
                    <TimeField
                        id="editor-sel-end"
                        label="Fim"
                        value={selEnd}
                        min={Math.min(duration, selStart + 0.05)}
                        max={duration}
                        onCommit={v => setSelection(selStart, v)}
                        onSetFromPlayhead={setEndFromPlayhead}
                    />
                    <TimeField
                        id="editor-sel-length"
                        label="Seleção"
                        value={selectionLength}
                        min={0.05}
                        max={Math.max(0.05, duration - selStart)}
                        onCommit={v => setSelection(selStart, selStart + v)}
                    />
                    <button type="button" className="editor-preview-btn editor-select-all" onClick={selectAll} disabled={!ready}>
                        Tudo
                    </button>
                </div>

                <p className="editor-result">
                    Resultado: <strong>{formatTimePrecise(resultDuration)}</strong>
                    {mode === 'remove' && ready && <> (o trecho de {formatTimePrecise(selectionLength)} será apagado)</>}
                    {recordedDuration > 0 && <> · inclui {formatTimePrecise(recordedDuration)} de extensão gravada</>}
                </p>

                </section>

                <section className="editor-section" aria-labelledby="editor-sec-fades">
                <h4 className="editor-section-title" id="editor-sec-fades">Entrada e saída</h4>
                <div className="editor-grid">
                <div className="editor-slider-group">
                    <div className="editor-slider-label">
                        <label htmlFor="editor-fade-in">Fade in</label>
                        <span>{fadeIn.toFixed(2)} s</span>
                    </div>
                    <input
                        id="editor-fade-in"
                        type="range"
                        className="editor-range"
                        min={0}
                        max={3}
                        step={0.05}
                        value={fadeIn}
                        onChange={e => setFadeIn(Number(e.target.value))}
                    />
                </div>

                <div className="editor-slider-group">
                    <div className="editor-slider-label">
                        <label htmlFor="editor-fade-out">Fade out</label>
                        <span>{fadeOut.toFixed(2)} s</span>
                    </div>
                    <input
                        id="editor-fade-out"
                        type="range"
                        className="editor-range"
                        min={0}
                        max={3}
                        step={0.05}
                        value={fadeOut}
                        onChange={e => setFadeOut(Number(e.target.value))}
                    />
                </div>

                </div>
                </section>

                <section className="editor-section" aria-labelledby="editor-sec-tom">
                <h4 className="editor-section-title" id="editor-sec-tom">Volume e timbre</h4>
                <div className="editor-grid">
                <div className="editor-slider-group">
                    <div className="editor-slider-label">
                        <label htmlFor="editor-volume">
                            <Volume2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Volume
                        </label>
                        <span>{volumeGain}%</span>
                    </div>
                    <input
                        id="editor-volume"
                        type="range"
                        className="editor-range"
                        min={0}
                        max={200}
                        step={1}
                        value={volumeGain}
                        onChange={e => setVolumeGain(Number(e.target.value))}
                    />
                </div>

                <div className="editor-slider-group">
                    <div className="editor-slider-label">
                        <label htmlFor="editor-bass">Graves</label>
                        <span>{bassGain > 0 ? `+${bassGain}` : bassGain} dB</span>
                    </div>
                    <input
                        id="editor-bass"
                        type="range"
                        className="editor-range"
                        min={-12}
                        max={12}
                        step={1}
                        value={bassGain}
                        onChange={e => setBassGain(Number(e.target.value))}
                    />
                </div>

                <div className="editor-slider-group">
                    <div className="editor-slider-label">
                        <label htmlFor="editor-treble">Agudos</label>
                        <span>{trebleGain > 0 ? `+${trebleGain}` : trebleGain} dB</span>
                    </div>
                    <input
                        id="editor-treble"
                        type="range"
                        className="editor-range"
                        min={-12}
                        max={12}
                        step={1}
                        value={trebleGain}
                        onChange={e => setTrebleGain(Number(e.target.value))}
                    />
                </div>

                <div className="editor-slider-group">
                    <div className="editor-slider-label">
                        <label htmlFor="editor-noise">Redução de Ruído</label>
                        <span>{noiseReduction}%</span>
                    </div>
                    <input
                        id="editor-noise"
                        type="range"
                        className="editor-range"
                        min={0}
                        max={100}
                        step={1}
                        value={noiseReduction}
                        onChange={e => setNoiseReduction(Number(e.target.value))}
                    />
                </div>

                </div>
                </section>

                <section className="editor-section" aria-labelledby="editor-sec-extensao">
                <h4 className="editor-section-title" id="editor-sec-extensao">Gravar extensão</h4>
                <div className="editor-slider-group">

                    {!hasRecording && !isRecording && (
                        <button className="editor-preview-btn" onClick={startRecording}>
                            <Mic size={16} />
                            Iniciar Gravação
                        </button>
                    )}

                    {isRecording && (
                        <div className="editor-rec">
                            <canvas ref={canvasRef} className="editor-rec-canvas"></canvas>
                            <div className="editor-rec-row">
                                <span className="editor-rec-time">{formatTimeMs(elapsedTime)}</span>
                                <button className="editor-preview-btn" onClick={isPaused ? resumeRecording : pauseRecording}>
                                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                                    {isPaused ? 'Retomar' : 'Pausar'}
                                </button>
                                <button className="editor-preview-btn editor-rec-stop" onClick={stopRecording}>
                                    <Square size={14} />
                                    Parar
                                </button>
                            </div>
                        </div>
                    )}

                    {hasRecording && recordedBlob && (
                        <div className="editor-rec">
                            <div className="editor-rec-row">
                                <span className="editor-rec-done">Extensão: {formatTimePrecise(recordedDuration)}</span>
                                <button className="editor-preview-btn editor-rec-remove" onClick={clearRecording}>
                                    Remover
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                </section>

                <div className="editor-actions-mobile">
                    <button className="editor-preview-btn" onClick={handlePreviewResult} disabled={!ready || previewState === 'rendering'}>
                        {previewState === 'rendering'
                            ? <Loader2 size={16} className="spin" />
                            : previewState === 'playing' ? <Square size={16} /> : <Headphones size={16} />}
                        {previewState === 'rendering' ? 'Gerando prévia…' : previewState === 'playing' ? 'Parar prévia' : 'Ouvir resultado'}
                    </button>
                </div>
            </div>

            <div className="step-actions">
                {onBack && (
                    <button className="btn-cancel" onClick={onBack}>
                        Voltar
                    </button>
                )}
                <button
                    className="btn-confirm"
                    onClick={handleExport}
                    disabled={isProcessing || !ready}
                >
                    {isProcessing ? (
                        <><Loader2 size={16} className="spin" /> Processando...</>
                    ) : (
                        'Confirmar Edição'
                    )}
                </button>
            </div>
        </div>
    );
}

export { AudioEditor };
