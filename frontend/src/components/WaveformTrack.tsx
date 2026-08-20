import { useEffect, useRef, useState, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, Save, Loader2, Trash2, History, Pencil } from 'lucide-react';
import { LayerVersionPanel } from './LayerVersionPanel';

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

interface LayerChanges {
    volume_padrao: number
    delay_offset: number
}

interface WaveformTrackProps {
    audioUrl?: string
    nome?: string
    autor?: string
    layerId: string
    delayOffset?: number
    volume?: number
    colorIndex?: number
    isGuia?: boolean
    estaAprovada?: boolean
    isOwner?: boolean
    isCollaborator?: boolean
    isLayerAuthor?: boolean
    totalVersoes?: number
    versaoAtual?: { numero: number } | null
    onSave?: (layerId: string, changes: LayerChanges) => void
    onRegister?: (layerId: string, ws: any) => void
    onAuthorize?: (layerId: string, aprovada: boolean) => void
    onDelete?: (layerId: string, layerName: string) => void
    onEdit?: (layerId: string) => void
    onVersionChange?: () => void
    saving?: boolean
}

function WaveformTrackInner({
    audioUrl,
    nome,
    autor,
    layerId,
    delayOffset = 0,
    volume = 1.0,
    colorIndex = 0,
    isGuia = false,
    estaAprovada = false,
    isOwner = false,
    isCollaborator = false,
    totalVersoes = 0,
    versaoAtual = null,
    onSave,
    onRegister,
    onAuthorize,
    onDelete,
    onEdit,
    onVersionChange,
    saving = false
}: WaveformTrackProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const wavesurferRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [localVolume, setLocalVolume] = useState(volume);
    const [isMuted, setIsMuted] = useState(false);
    const [localDelay, setLocalDelay] = useState(delayOffset);
    const [hasChanges, setHasChanges] = useState(false);
    const [versionPanelOpen, setVersionPanelOpen] = useState(false);

    const color = COLORS[colorIndex % COLORS.length];

    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        let cancelled = false;

        async function initWaveSurfer() {
            const { default: WaveSurferModule } = await import('wavesurfer.js');
            if (cancelled || !containerRef.current) return;

            const wavesurfer = WaveSurferModule.create({
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

            wavesurfer.load(audioUrl!);

            wavesurfer.on('ready', () => {
                if (!cancelled) {
                    setDuration(wavesurfer.getDuration());
                    wavesurfer.setVolume(localVolume);
                }
            });

            wavesurfer.on('audioprocess', () => {
                if (!cancelled) setCurrentTime(wavesurfer.getCurrentTime());
            });

            wavesurfer.on('seeking', () => {
                if (!cancelled) setCurrentTime(wavesurfer.getCurrentTime());
            });

            wavesurfer.on('play', () => { if (!cancelled) setIsPlaying(true); });
            wavesurfer.on('pause', () => { if (!cancelled) setIsPlaying(false); });
            wavesurfer.on('finish', () => { if (!cancelled) setIsPlaying(false); });

            wavesurferRef.current = wavesurfer;

            if (onRegister) {
                onRegister(layerId, wavesurfer);
            }
        }

        initWaveSurfer();

        return () => {
            cancelled = true;
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
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

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setLocalVolume(newVolume);
        setHasChanges(true);
    };

    const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDelay = parseInt(e.target.value) || 0;
        setLocalDelay(newDelay);
        setHasChanges(true);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const formatTime = (seconds: number) => {
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
                {!isGuia && (
                    <div className="track-actions">
                        <span className={`status-badge ${estaAprovada ? 'approved' : 'pending'}`}>
                            {estaAprovada ? 'Aprovada' : 'Pendente'}
                        </span>
                        {!isGuia && totalVersoes > 0 && (
                            <button
                                className="btn-version-history"
                                onClick={() => setVersionPanelOpen(true)}
                                title={`Histórico de versões (${totalVersoes})`}
                            >
                                <History size={14} />
                                v{versaoAtual?.numero || 1}
                            </button>
                        )}
                        {(isOwner || isCollaborator) && (
                            <button
                                className="btn-auth approve"
                                onClick={() => onEdit?.(layerId)}
                                title="Editar áudio"
                            >
                                <Pencil size={14} />
                            </button>
                        )}
                        {isOwner && (
                            <>
                                {!estaAprovada && (
                                    <button
                                        className="btn-auth approve"
                                        onClick={() => onAuthorize?.(layerId, true)}
                                        title="Aprovar camada"
                                    >
                                        Aprovar
                                    </button>
                                )}
                                <button
                                    className="btn-auth reject"
                                    onClick={() => onAuthorize?.(layerId, false)}
                                    title={estaAprovada ? 'Rejeitar camada' : 'Rejeitar camada'}
                                >
                                    Rejeitar
                                </button>
                                <button
                                    className="btn-auth reject"
                                    onClick={() => onDelete?.(layerId, nome || 'Track')}
                                    title="Excluir camada"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            <div className="waveform-container" ref={containerRef}></div>
            <div className="track-time">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            {!isGuia && (
                <LayerVersionPanel
                    layerId={layerId}
                    isOpen={versionPanelOpen}
                    onClose={() => setVersionPanelOpen(false)}
                    onRollback={onVersionChange}
                />
            )}
        </div>
    );
}

const WaveformTrack = memo(WaveformTrackInner);

export { WaveformTrack };
