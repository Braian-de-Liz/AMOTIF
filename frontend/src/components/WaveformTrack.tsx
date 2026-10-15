import { useEffect, useRef, useState, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, Save, Loader2, Trash2, History, Pencil, Bookmark } from 'lucide-react';
import { LayerVersionPanel } from './LayerVersionPanel';
import { VersionDetailModal } from './VersionDetailModal';
import { BranchSelector } from './BranchSelector';
import { createManualVersion } from '../utility/branchApi';

// Tons da paleta (verdes e latão) legíveis sobre o fundo claro da waveform.
const COLORS = [
    '#5c7a44',
    '#b8912f',
    '#7a9f6a',
    '#8c6d1f',
    '#3f5a2c',
    '#9a8a4a',
    '#4d6b5a',
    '#a3782b'
];

interface VersionAutor {
    id: string
    nome_completo: string
    avatar_url?: string | null
}

interface Version {
    id: string
    camadaId: string
    audio_url: string
    nome_trilha: string
    instrumento_tag: string
    delay_offset: number
    volume_padrao: number
    bpm_original?: number | null
    transposicao_semitons?: number
    versionNumber: number
    mensagem?: string | null
    tag?: string | null
    createdAt: string
    autor: VersionAutor
}

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
    versaoAtual?: { id?: string; numero: number } | null
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
    const [audioErro, setAudioErro] = useState(false);
    const wavesurferRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [localVolume, setLocalVolume] = useState(volume);
    const [isMuted, setIsMuted] = useState(false);
    const [localDelay, setLocalDelay] = useState(delayOffset);
    const [hasChanges, setHasChanges] = useState(false);
    const [versionPanelOpen, setVersionPanelOpen] = useState(false);
    const [detailVersion, setDetailVersion] = useState<Version | null>(null);

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
                progressColor: '#1f2b1a',
                cursorColor: '#1f2b1a',
                barWidth: 2,
                barGap: 1,
                barRadius: 3,
                height: 100,
                normalize: true,
                backend: 'WebAudio',
            });

            wavesurfer.load(audioUrl!);

            // Link de áudio expirado ou indisponível: recarregar a página busca um novo acesso.
            wavesurfer.on('error', () => {
                if (!cancelled) setAudioErro(true);
            });

            wavesurfer.on('ready', () => {
                if (!cancelled) {
                    setAudioErro(false);
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

    const [savingVersion, setSavingVersion] = useState(false);

    const handleSaveVersion = async () => {
        setSavingVersion(true);
        try {
            await createManualVersion(layerId, {
                mensagem: `Commit manual - ${new Date().toLocaleString('pt-BR')}`,
                tag: undefined
            });
            onVersionChange?.();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erro ao criar versão');
        } finally {
            setSavingVersion(false);
        }
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
                                className="btn-save-version"
                                onClick={handleSaveVersion}
                                disabled={savingVersion}
                                title="Salvar versão atual (commit manual)"
                                aria-label="Salvar versão atual"
                            >
                                {savingVersion ? <Loader2 size={14} className="spin" /> : <Bookmark size={14} />}
                            </button>
                        )}
                        {(isOwner || isCollaborator) && (
                            <button
                                className="btn-save-version"
                                onClick={() => onEdit?.(layerId)}
                                title="Editar áudio"
                                aria-label="Editar áudio"
                            >
                                <Pencil size={14} />
                            </button>
                        )}
                        {!isGuia && (isOwner || isCollaborator) && (
                            <BranchSelector
                                layerId={layerId}
                                currentVersionId={versaoAtual?.id || undefined}
                                onSwitch={onVersionChange}
                                disabled={!isOwner && !isCollaborator}
                            />
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
                                    title="Rejeitar camada"
                                >
                                    Rejeitar
                                </button>
                                <button
                                    className="btn-auth reject"
                                    onClick={() => onDelete?.(layerId, nome || 'Track')}
                                    title="Excluir camada"
                                    aria-label="Excluir camada"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            <div className="waveform-container" ref={containerRef}></div>
            {audioErro && (
                <p className="error-msg">Não foi possível carregar o áudio. Recarregue a página para atualizar o acesso.</p>
            )}
            <div className="track-time">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            {!isGuia && (
                <>
                    <LayerVersionPanel
                        layerId={layerId}
                        isOpen={versionPanelOpen}
                        onClose={() => setVersionPanelOpen(false)}
                        onRollback={onVersionChange}
                        onRestoreInPlace={onVersionChange}
                        onOpenDetail={setDetailVersion}
                    />
                    <VersionDetailModal
                        version={detailVersion}
                        isOpen={!!detailVersion}
                        onClose={() => setDetailVersion(null)}
                        layerId={layerId}
                        onRollback={onVersionChange}
                        onRestoreInPlace={onVersionChange}
                        onTagUpdate={onVersionChange}
                    />
                </>
            )}
        </div>
    );
}

const WaveformTrack = memo(WaveformTrackInner);

export { WaveformTrack };
