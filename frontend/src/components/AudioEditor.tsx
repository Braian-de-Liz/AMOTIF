import { useState, useRef, useCallback, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Scissors, Volume2 } from 'lucide-react';

interface AudioEditorProps {
    audioBlob: Blob
    audioDuration: number
    onEdited: (blob: Blob) => void
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

function AudioEditor({ audioBlob, audioDuration, onEdited }: AudioEditorProps) {
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(100);
    const [volumeGain, setVolumeGain] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const audioUrlRef = useRef<string | null>(null);

    const trimStartSec = (trimStart / 100) * audioDuration;
    const trimEndSec = (trimEnd / 100) * audioDuration;
    const trimmedDuration = trimEndSec - trimStartSec;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const url = URL.createObjectURL(audioBlob);
        audioUrlRef.current = url;

        const ws = WaveSurfer.create({
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
            setTrimEnd(100);
        });

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => setIsPlaying(false));

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
            }
        };
    }, [audioBlob]);

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

    const handleExport = useCallback(async () => {
        setIsProcessing(true);

        try {
            const audioContext = new AudioContext();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const startSample = Math.floor((trimStart / 100) * audioBuffer.length);
            const endSample = Math.floor((trimEnd / 100) * audioBuffer.length);
            const newLength = endSample - startSample;

            if (newLength <= 0) {
                setIsProcessing(false);
                return;
            }

            const offlineContext = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                newLength,
                audioBuffer.sampleRate
            );

            const newBuffer = offlineContext.createBuffer(
                audioBuffer.numberOfChannels,
                newLength,
                audioBuffer.sampleRate
            );

            const gain = volumeGain / 100;

            for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                const sourceData = audioBuffer.getChannelData(ch);
                const destData = newBuffer.getChannelData(ch);
                for (let i = 0; i < newLength; i++) {
                    destData[i] = sourceData[startSample + i] * gain;
                }
            }

            const source = offlineContext.createBufferSource();
            source.buffer = newBuffer;
            source.connect(offlineContext.destination);
            source.start();

            const renderedBuffer = await offlineContext.startRendering();
            const wavBlob = encodeWav(renderedBuffer);

            onEdited(wavBlob);
        } catch (err) {
            console.error('Erro ao processar áudio:', err);
        } finally {
            setIsProcessing(false);
        }
    }, [audioBlob, trimStart, trimEnd, volumeGain, onEdited]);

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
                            value={formatTime(trimmedDuration)}
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

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
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
                <button
                    className="btn-confirm"
                    onClick={handleExport}
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Processando...' : 'Confirmar Edição'}
                </button>
            </div>
        </div>
    );
}

export { AudioEditor };
