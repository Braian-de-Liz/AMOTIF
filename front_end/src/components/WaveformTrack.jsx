import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Volume2, VolumeX, Save, Loader2 } from 'lucide-react';

const COLORS = [
    '#22c55e',
    '#3b82f6',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#06b6d4',
    '#ef4444',
    '#84cc16'
];

function WaveformTrack({ 
    audioUrl, 
    nome, 
    autor, 
    layerId, 
    delayOffset = 0, 
    volume = 1.0,
    colorIndex = 0,
    isGuia = false,
    onSave,
    onRegister,
    saving = false
}) {
    const containerRef = useRef(null);
    const wavesurferRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [localVolume, setLocalVolume] = useState(volume);
    const [isMuted, setIsMuted] = useState(false);
    const [localDelay, setLocalDelay] = useState(delayOffset);
    const [hasChanges, setHasChanges] = useState(false);

    const color = COLORS[colorIndex % COLORS.length];

    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: color,
            progressColor: '#1f2937',
            cursorColor: '#fff',
            barWidth: 2,
            barGap: 1,
            barRadius: 3,
            height: 100,
            normalize: true,
            backend: 'WebAudio',
        });

        wavesurfer.load(audioUrl);

        wavesurfer.on('ready', () => {
            setDuration(wavesurfer.getDuration());
            wavesurfer.setVolume(localVolume);
        });

        wavesurfer.on('audioprocess', () => {
            setCurrentTime(wavesurfer.getCurrentTime());
        });

        wavesurfer.on('seeking', () => {
            setCurrentTime(wavesurfer.getCurrentTime());
        });

        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('finish', () => setIsPlaying(false));

        wavesurferRef.current = wavesurfer;

        if (onRegister) {
            onRegister(layerId, wavesurfer);
        }

        return () => {
            wavesurfer.destroy();
            if (onRegister) {
                onRegister(layerId, null);
            }
        };
    }, [audioUrl, color, layerId, onRegister]);

    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.setVolume(isMuted ? 0 : localVolume);
        }
    }, [localVolume, isMuted]);

    const togglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setLocalVolume(newVolume);
        setHasChanges(true);
    };

    const handleDelayChange = (e) => {
        const newDelay = parseInt(e.target.value) || 0;
        setLocalDelay(newDelay);
        setHasChanges(true);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSave = () => {
        if (onSave) {
            onSave(layerId, {
                volume_padrao: localVolume,
                delay_offset: localDelay
            });
        }
        setHasChanges(false);
    };

    return (
        <div className="waveform-track">
            <div className="track-header">
                <div className="track-info">
                    <h4>{nome || 'Track'}</h4>
                    {autor && <small>por {autor}</small>}
                    {isGuia && <span className="guia-badge">Guia</span>}
                </div>
                <div className="track-controls">
                    <button 
                        className="btn-icon" 
                        onClick={togglePlay}
                        title={isPlaying ? 'Pausar' : 'Reproduzir'}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button 
                        className={`btn-icon ${isMuted ? 'active' : ''}`}
                        onClick={toggleMute}
                        title={isMuted ? 'Ativar som' : 'Silenciar'}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={localVolume}
                        onChange={handleVolumeChange}
                        className="volume-slider"
                        title={`Volume: ${Math.round(localVolume * 100)}%`}
                    />
                    {!isGuia && (
                        <div className="delay-control">
                            <label>Delay (ms):</label>
                            <input
                                type="number"
                                value={localDelay}
                                onChange={handleDelayChange}
                                className="delay-input"
                                placeholder="0"
                            />
                        </div>
                    )}
                    {!isGuia && hasChanges && (
                        <button className="btn-save" onClick={handleSave} disabled={saving} title="Salvar">
                            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                        </button>
                    )}
                </div>
            </div>
            <div className="waveform-container" ref={containerRef}></div>
            <div className="track-time">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
}

export { WaveformTrack };