import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Scissors, Volume2, Mic, Square, Loader2 } from 'lucide-react';

interface AudioEditorProps {
    audioBlob?: Blob
    audioUrl?: string
    audioDuration: number
    onEdited: (blob: Blob) => void
    onBack?: () => void
}

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

function concatenateBuffers(ctx: OfflineAudioContext, buffers: AudioBuffer[]): AudioBuffer {
    if (buffers.length === 1) return buffers[0];

    const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
    const sampleRate = buffers[0].sampleRate;
    const numChannels = Math.max(...buffers.map(b => b.numberOfChannels));

    const result = ctx.createBuffer(numChannels, totalLength, sampleRate);
    let offset = 0;

    for (const buf of buffers) {
        for (let ch = 0; ch < numChannels; ch++) {
            const src = ch < buf.numberOfChannels ? buf.getChannelData(ch) : buf.getChannelData(0);
            const dest = result.getChannelData(ch);
            dest.set(src, offset);
        }
        offset += buf.length;
    }

    return result;
}

function AudioEditor({ audioBlob, audioUrl, audioDuration, onEdited, onBack }: AudioEditorProps) {
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(100);
    const [volumeGain, setVolumeGain] = useState(100);
    const [bassGain, setBassGain] = useState(0);
    const [trebleGain, setTrebleGain] = useState(0);
    const [noiseReduction, setNoiseReduction] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [hasRecording, setHasRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordedDuration, setRecordedDuration] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const wavesurferRef = useRef<any>(null);
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
    const previewContainerRef = useRef<HTMLDivElement | null>(null);
    const previewWaveSurferRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const trimStartSec = (trimStart / 100) * audioDuration;
    const trimEndSec = (trimEnd / 100) * audioDuration;
    const trimmedDuration = trimEndSec - trimStartSec;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimeMs = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!containerRef.current) return;

        let cancelled = false;

        async function initWaveSurfer() {
            const { default: WaveSurferModule } = await import('wavesurfer.js');
            if (cancelled || !containerRef.current) return;

            const url = audioBlob ? URL.createObjectURL(audioBlob) : audioUrl!;
            audioUrlRef.current = url;

            const ws = WaveSurferModule.create({
                container: containerRef.current,
                waveColor: '#22c55e',
                progressColor: '#1f2937',
                cursorColor: '#fff',
                barWidth: 2,
                barGap: 1,
                barRadius: 3,
                height: 140,
                normalize: true,
                backend: 'WebAudio',
            });

            ws.load(url);

            ws.on('ready', () => {
                if (!cancelled) setTrimEnd(100);
            });

            ws.on('play', () => { if (!cancelled) setIsPlaying(true); });
            ws.on('pause', () => { if (!cancelled) setIsPlaying(false); });
            ws.on('finish', () => { if (!cancelled) setIsPlaying(false); });

            wavesurferRef.current = ws;
        }

        initWaveSurfer();

        return () => {
            cancelled = true;
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
            if (audioBlob && audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
            }
        };
    }, [audioBlob, audioUrl]);

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

    const handleTrimStartChange = (value: number) => {
        if (value < trimEnd - 1) {
            setTrimStart(value);
        }
    };

    const handleTrimEndChange = (value: number) => {
        if (value > trimStart + 1) {
            setTrimEnd(value);
        }
    };

    const togglePlayback = useCallback(() => {
        if (!wavesurferRef.current) return;

        if (isPlaying) {
            wavesurferRef.current.pause();
        } else {
            const ws = wavesurferRef.current;
            const duration = ws.getDuration();
            const startSec = (trimStart / 100) * duration;
            ws.seekTo(startSec / duration);
            ws.play();
        }
    }, [isPlaying, trimStart]);

    const handlePreviewTrim = useCallback(() => {
        if (!wavesurferRef.current) return;

        const ws = wavesurferRef.current;
        const duration = ws.getDuration();
        const startSec = (trimStart / 100) * duration;
        const endSec = (trimEnd / 100) * duration;

        ws.seekTo(startSec / duration);
        ws.play();

        const checkEnd = () => {
            if (ws.getCurrentTime() >= endSec) {
                ws.pause();
                ws.un('audioprocess', checkEnd);
            }
        };
        ws.on('audioprocess', checkEnd);
    }, [trimStart, trimEnd]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            const recorder = new MediaRecorder(stream, { mimeType });
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
            alert('Não foi possível acessar o microfone.');
        }
    }, [startTimer, stopTimer, drawVisualizer, stopVisualizer]);

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

    const handleExport = useCallback(async () => {
        setIsProcessing(true);

        try {
            const audioContext = new AudioContext();
            const buffers: AudioBuffer[] = [];

            if (audioBlob) {
                const arrayBuffer = await audioBlob.arrayBuffer();
                const fullBuffer = await audioContext.decodeAudioData(arrayBuffer);

                const startSample = Math.floor((trimStart / 100) * fullBuffer.length);
                const endSample = Math.floor((trimEnd / 100) * fullBuffer.length);
                const newLength = endSample - startSample;

                if (newLength > 0) {
                    const trimmedBuffer = audioContext.createBuffer(
                        fullBuffer.numberOfChannels,
                        newLength,
                        fullBuffer.sampleRate
                    );

                    for (let ch = 0; ch < fullBuffer.numberOfChannels; ch++) {
                        const sourceData = fullBuffer.getChannelData(ch);
                        const destData = trimmedBuffer.getChannelData(ch);
                        for (let i = 0; i < newLength; i++) {
                            destData[i] = sourceData[startSample + i];
                        }
                    }

                    buffers.push(trimmedBuffer);
                }
            } else if (audioUrl) {
                const response = await fetch(audioUrl);
                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();
                const fullBuffer = await audioContext.decodeAudioData(arrayBuffer);

                const startSample = Math.floor((trimStart / 100) * fullBuffer.length);
                const endSample = Math.floor((trimEnd / 100) * fullBuffer.length);
                const newLength = endSample - startSample;

                if (newLength > 0) {
                    const trimmedBuffer = audioContext.createBuffer(
                        fullBuffer.numberOfChannels,
                        newLength,
                        fullBuffer.sampleRate
                    );

                    for (let ch = 0; ch < fullBuffer.numberOfChannels; ch++) {
                        const sourceData = fullBuffer.getChannelData(ch);
                        const destData = trimmedBuffer.getChannelData(ch);
                        for (let i = 0; i < newLength; i++) {
                            destData[i] = sourceData[startSample + i];
                        }
                    }

                    buffers.push(trimmedBuffer);
                }
            }

            if (recordedBlob) {
                const arrayBuffer = await recordedBlob.arrayBuffer();
                const recBuffer = await audioContext.decodeAudioData(arrayBuffer);
                buffers.push(recBuffer);
            }

            if (buffers.length === 0) {
                setIsProcessing(false);
                return;
            }

            const sampleRate = buffers[0].sampleRate;
            const numChannels = Math.max(...buffers.map(b => b.numberOfChannels));
            const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);

            const offlineCtx = new OfflineAudioContext(numChannels, totalLength, sampleRate);

            const mergedBuffer = concatenateBuffers(offlineCtx, buffers);

            const gain = volumeGain / 100;

            const finalBuffer = offlineCtx.createBuffer(numChannels, mergedBuffer.length, sampleRate);

            for (let ch = 0; ch < numChannels; ch++) {
                const srcData = mergedBuffer.getChannelData(ch);
                const destData = finalBuffer.getChannelData(ch);
                for (let i = 0; i < srcData.length; i++) {
                    destData[i] = srcData[i] * gain;
                }
            }

            if (bassGain !== 0) {
                const bassFilter = offlineCtx.createBiquadFilter();
                bassFilter.type = 'lowshelf';
                bassFilter.frequency.value = 80;
                bassFilter.gain.value = bassGain;

                const tempBuffer = offlineCtx.createBuffer(numChannels, finalBuffer.length, sampleRate);
                for (let ch = 0; ch < numChannels; ch++) {
                    tempBuffer.getChannelData(ch).set(finalBuffer.getChannelData(ch));
                }

                const source = offlineCtx.createBufferSource();
                source.buffer = tempBuffer;
                const merger = offlineCtx.createChannelMerger(numChannels);
                const splitter = offlineCtx.createChannelSplitter(numChannels);

                source.connect(splitter);
                for (let ch = 0; ch < numChannels; ch++) {
                    splitter.connect(bassFilter, ch);
                    bassFilter.connect(merger, 0, ch);
                }
                merger.connect(offlineCtx.destination);
                source.start();

                const rendered = await offlineCtx.startRendering();
                for (let ch = 0; ch < numChannels; ch++) {
                    finalBuffer.getChannelData(ch).set(rendered.getChannelData(ch));
                }
            }

            if (trebleGain !== 0) {
                const trebleFilter = offlineCtx.createBiquadFilter();
                trebleFilter.type = 'highshelf';
                trebleFilter.frequency.value = 6000;
                trebleFilter.gain.value = trebleGain;

                const tempBuffer = offlineCtx.createBuffer(numChannels, finalBuffer.length, sampleRate);
                for (let ch = 0; ch < numChannels; ch++) {
                    tempBuffer.getChannelData(ch).set(finalBuffer.getChannelData(ch));
                }

                const source = offlineCtx.createBufferSource();
                source.buffer = tempBuffer;
                const merger = offlineCtx.createChannelMerger(numChannels);
                const splitter = offlineCtx.createChannelSplitter(numChannels);

                source.connect(splitter);
                for (let ch = 0; ch < numChannels; ch++) {
                    splitter.connect(trebleFilter, ch);
                    trebleFilter.connect(merger, 0, ch);
                }
                merger.connect(offlineCtx.destination);
                source.start();

                const rendered = await offlineCtx.startRendering();
                for (let ch = 0; ch < numChannels; ch++) {
                    finalBuffer.getChannelData(ch).set(rendered.getChannelData(ch));
                }
            }

            if (noiseReduction > 0) {
                const threshold = noiseReduction / 100 * 0.1;

                for (let ch = 0; ch < numChannels; ch++) {
                    const data = finalBuffer.getChannelData(ch);
                    for (let i = 0; i < data.length; i++) {
                        if (Math.abs(data[i]) < threshold) {
                            data[i] *= (1 - noiseReduction / 100);
                        }
                    }
                }
            }

            const source = offlineCtx.createBufferSource();
            source.buffer = finalBuffer;
            source.connect(offlineCtx.destination);
            source.start();

            const renderedBuffer = await offlineCtx.startRendering();
            const wavBlob = encodeWav(renderedBuffer);

            onEdited(wavBlob);
        } catch (err) {
            console.error('Erro ao processar áudio:', err);
        } finally {
            setIsProcessing(false);
        }
    }, [audioBlob, audioUrl, trimStart, trimEnd, volumeGain, bassGain, trebleGain, noiseReduction, recordedBlob, onEdited]);

    const regionLeft = `${trimStart}%`;
    const regionWidth = `${trimEnd - trimStart}%`;

    return (
        <div className="editor-area">
            <div className="editor-waveform-container">
                <div ref={containerRef}></div>
                <div
                    className="waveform-region"
                    style={{ left: regionLeft, width: regionWidth }}
                ></div>
            </div>

            <div className="editor-controls">
                <div className="editor-slider-group">
                    <div className="editor-slider-label">
                        <span>
                            <Scissors size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Início do corte
                        </span>
                        <span>{formatTime(trimStartSec)}</span>
                    </div>
                    <input
                        type="range"
                        className="editor-range"
                        min={0}
                        max={100}
                        step={0.1}
                        value={trimStart}
                        onChange={e => handleTrimStartChange(Number(e.target.value))}
                    />
                </div>

                <div className="editor-slider-group">
                    <div className="editor-slider-label">
                        <span>
                            <Scissors size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Fim do corte
                        </span>
                        <span>{formatTime(trimEndSec)}</span>
                    </div>
                    <input
                        type="range"
                        className="editor-range"
                        min={0}
                        max={100}
                        step={0.1}
                        value={trimEnd}
                        onChange={e => handleTrimEndChange(Number(e.target.value))}
                    />
                </div>

                <div className="trim-inputs">
                    <div className="trim-input-group">
                        <label>Inicio</label>
                        <input
                            type="text"
                            className="trim-input"
                            value={formatTime(trimStartSec)}
                            readOnly
                        />
                    </div>
                    <span className="trim-separator">→</span>
                    <div className="trim-input-group">
                        <label>Fim</label>
                        <input
                            type="text"
                            className="trim-input"
                            value={formatTime(trimEndSec)}
                            readOnly
                        />
                    </div>
                    <div className="trim-input-group">
                        <label>Duração</label>
                        <input
                            type="text"
                            className="trim-input"
                            value={formatTime(trimmedDuration + (recordedDuration || 0))}
                            readOnly
                        />
                    </div>
                </div>

                <div className="editor-slider-group">
                    <div className="editor-slider-label">
                        <span>
                            <Volume2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Volume
                        </span>
                        <span>{volumeGain}%</span>
                    </div>
                    <input
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
                        <span> graves</span>
                        <span>{bassGain > 0 ? `+${bassGain}` : bassGain} dB</span>
                    </div>
                    <input
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
                        <span> agudos</span>
                        <span>{trebleGain > 0 ? `+${trebleGain}` : trebleGain} dB</span>
                    </div>
                    <input
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
                        <span>Redução de Ruído</span>
                        <span>{noiseReduction}%</span>
                    </div>
                    <input
                        type="range"
                        className="editor-range"
                        min={0}
                        max={100}
                        step={1}
                        value={noiseReduction}
                        onChange={e => setNoiseReduction(Number(e.target.value))}
                    />
                </div>

                <div className="editor-divider" style={{ borderTop: '1px solid rgba(92,122,68,0.15)', margin: '1rem 0' }}></div>

                <div className="editor-slider-group">
                    <div className="editor-slider-label">
                        <span>
                            <Mic size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Gravar Extensão
                        </span>
                    </div>

                    {!hasRecording && !isRecording && (
                        <button className="editor-preview-btn" onClick={startRecording} style={{ marginTop: '0.5rem' }}>
                            <Mic size={16} />
                            Iniciar Gravação
                        </button>
                    )}

                    {isRecording && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <canvas
                                ref={canvasRef}
                                style={{ width: '100%', height: 60, borderRadius: 8, background: 'rgba(0,0,0,0.05)' }}
                            ></canvas>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--verde-musgo)' }}>
                                    {formatTimeMs(elapsedTime)}
                                </span>
                                <button className="editor-preview-btn" onClick={isPaused ? resumeRecording : pauseRecording}>
                                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                                    {isPaused ? 'Retomar' : 'Pausar'}
                                </button>
                                <button className="editor-preview-btn" onClick={stopRecording} style={{ background: '#ef4444', color: '#fff' }}>
                                    <Square size={14} />
                                    Parar
                                </button>
                            </div>
                        </div>
                    )}

                    {hasRecording && recordedBlob && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--texto-secundario)' }}>
                                    Extensão: {formatTime(recordedDuration)}
                                </span>
                                <button
                                    className="editor-preview-btn"
                                    onClick={clearRecording}
                                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                >
                                    Remover
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="editor-actions-mobile" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button className="editor-preview-btn" onClick={togglePlayback}>
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        {isPlaying ? 'Pausar' : 'Reproduzir'}
                    </button>
                    <button className="editor-preview-btn" onClick={handlePreviewTrim}>
                        <Scissors size={16} />
                        Preview do Corte
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
                    disabled={isProcessing}
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
