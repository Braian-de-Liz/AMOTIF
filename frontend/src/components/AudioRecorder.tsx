import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';

interface AudioRecorderProps {
    onRecordingComplete: (blob: Blob, duration: number) => void
}

function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [hasRecording, setHasRecording] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
    const [recordedDuration, setRecordedDuration] = useState(0);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animFrameRef = useRef<number>(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedTimeRef = useRef<number>(0);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const previewContainerRef = useRef<HTMLDivElement | null>(null);

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
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
        }
    }, []);

    const startTimer = useCallback(() => {
        startTimeRef.current = Date.now() - pausedTimeRef.current;
        timerRef.current = setInterval(() => {
            setElapsedTime(Date.now() - startTimeRef.current);
        }, 100);
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const requestMicPermission = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            setPermissionGranted(true);
            return true;
        } catch {
            setPermissionGranted(false);
            return false;
        }
    }, []);

    const startRecording = useCallback(async () => {
        if (!streamRef.current) {
            const ok = await requestMicPermission();
            if (!ok) return;
        }

        chunksRef.current = [];
        pausedTimeRef.current = 0;
        setElapsedTime(0);

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm';

        const recorder = new MediaRecorder(streamRef.current!, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const durationSec = elapsedTime / 1000;

            setRecordedBlobUrl(url);
            setRecordedDuration(durationSec);
            setHasRecording(true);
            setIsRecording(false);
            setIsPaused(false);
            stopVisualizer();

            onRecordingComplete(blob, durationSec);
        };

        recorder.start(100);
        setIsRecording(true);
        setIsPaused(false);
        startTimer();
        drawVisualizer();
    }, [requestMicPermission, elapsedTime, stopVisualizer, startTimer, drawVisualizer, onRecordingComplete]);

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

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        }
    }, [stopTimer]);

    const togglePreviewPlayback = useCallback(() => {
        if (!recordedBlobUrl) return;

        if (isPlayingPreview && wavesurferRef.current) {
            wavesurferRef.current.pause();
            setIsPlayingPreview(false);
            return;
        }

        if (wavesurferRef.current) {
            wavesurferRef.current.play();
            setIsPlayingPreview(true);
            return;
        }

        if (previewContainerRef.current) {
            const ws = WaveSurfer.create({
                container: previewContainerRef.current,
                waveColor: '#22c55e',
                progressColor: '#1f2937',
                cursorColor: '#fff',
                barWidth: 2,
                barGap: 1,
                barRadius: 3,
                height: 80,
                normalize: true,
                backend: 'WebAudio',
            });

            ws.load(recordedBlobUrl);
            ws.on('ready', () => {
                ws.play();
                setIsPlayingPreview(true);
            });
            ws.on('finish', () => setIsPlayingPreview(false));
            ws.on('pause', () => setIsPlayingPreview(false));

            wavesurferRef.current = ws;
        }
    }, [recordedBlobUrl, isPlayingPreview]);

    useEffect(() => {
        return () => {
            stopTimer();
            stopVisualizer();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            if (recordedBlobUrl) {
                URL.revokeObjectURL(recordedBlobUrl);
            }
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
            }
        };
    }, [stopTimer, stopVisualizer, recordedBlobUrl]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.offsetWidth * 2;
            canvas.height = canvas.offsetHeight * 2;
        }
    }, []);

    if (permissionGranted === false) {
        return (
            <div className="mic-permission-overlay">
                <Mic size={48} />
                <h3>Acesso ao microfone necessário</h3>
                <p>
                    Para gravar áudio, precisamos de acesso ao seu microfone.
                    Permita o acesso nas configurações do navegador e tente novamente.
                </p>
                <button className="btn-grant-permission" onClick={requestMicPermission}>
                    Tentar Novamente
                </button>
            </div>
        );
    }

    if (hasRecording && recordedBlobUrl) {
        return (
            <div className="recorded-preview">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                    <h3>
                        <Mic size={16} />
                        Gravação Concluída
                    </h3>
                    <button
                        className="btn-rerecord"
                        onClick={() => {
                            setHasRecording(false);
                            setRecordedBlobUrl(null);
                            setElapsedTime(0);
                            pausedTimeRef.current = 0;
                            if (wavesurferRef.current) {
                                wavesurferRef.current.destroy();
                                wavesurferRef.current = null;
                            }
                        }}
                    >
                        <Mic size={14} />
                        Gravar Novamente
                    </button>
                </div>

                <div className="recorded-waveform" ref={previewContainerRef}></div>

                <div className="recorded-meta">
                    <span>Duração: <strong>{formatTime(recordedDuration * 1000)}</strong></span>
                </div>

                <button
                    className="editor-preview-btn"
                    onClick={togglePreviewPlayback}
                >
                    {isPlayingPreview ? <Pause size={16} /> : <Play size={16} />}
                    {isPlayingPreview ? 'Pausar' : 'Reproduzir'}
                </button>
            </div>
        );
    }

    return (
        <div className="recording-area">
            <div className="recording-visualizer">
                <canvas ref={canvasRef}></canvas>
                <div className={`recording-timer ${isRecording && !isPaused ? 'active' : ''}`}>
                    {formatTime(elapsedTime)}
                </div>
            </div>

            <div className="recording-controls">
                <button
                    className="btn-transport"
                    disabled={!isRecording}
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    title={isPaused ? 'Retomar' : 'Pausar'}
                >
                    {isPaused ? <Play size={18} /> : <Pause size={18} />}
                </button>

                <button
                    className={`btn-record ${isRecording ? 'recording' : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    title={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
                >
                    {isRecording && <Square size={20} color="#fff" />}
                </button>

                <button
                    className="btn-transport"
                    disabled={!isRecording}
                    onClick={stopRecording}
                    title="Parar"
                >
                    <Square size={18} />
                </button>
            </div>

            <div className={`recording-status ${isRecording && !isPaused ? 'active' : ''}`}>
                {isRecording && !isPaused && 'Gravando...'}
                {isRecording && isPaused && 'Pausado'}
                {!isRecording && 'Clique no botão vermelho para iniciar a gravação'}
            </div>
        </div>
    );
}

export { AudioRecorder };
