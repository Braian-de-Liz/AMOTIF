import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { RotateCcw, Undo2, Loader2, Volume2, VolumeX, Tag, Save, X } from 'lucide-react';
import { URL_API_TESTE } from '../utility/url_apis';
import { updateVersionTag } from '../utility/branchApi';

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
    versionNumber: number
    mensagem?: string | null
    tag?: string | null
    createdAt: string
    autor: VersionAutor
}

interface VersionDetailModalProps {
    version: Version | null
    isOpen: boolean
    onClose: () => void
    layerId: string
    onRollback?: () => void
    onRestoreInPlace?: () => void
    onTagUpdate?: () => void
}

function VersionDetailModal({ version, isOpen, onClose, layerId, onRollback, onRestoreInPlace, onTagUpdate }: VersionDetailModalProps) {
    const waveformRef = useRef<HTMLDivElement | null>(null);
    const [wavesurfer, setWavesurfer] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [localVolume, setLocalVolume] = useState(1.0);
    const [isMuted, setIsMuted] = useState(false);
    const [loadingWaveform, setLoadingWaveform] = useState(true);
    const [rollbacking, setRollbacking] = useState(false);
    const [restoringInPlace, setRestoringInPlace] = useState(false);
    const [editingTag, setEditingTag] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [savingTag, setSavingTag] = useState(false);

    useEffect(() => {
        if (!isOpen || !version || !waveformRef.current || !version.audio_url) return;

        let cancelled = false;

        async function initWaveSurfer() {
            const { default: WaveSurferModule } = await import('wavesurfer.js');
            if (cancelled || !waveformRef.current) return;

            const ws = WaveSurferModule.create({
                container: waveformRef.current,
                waveColor: '#22c55e',
                progressColor: '#1f2937',
                cursorColor: '#fff',
                barWidth: 2,
                barGap: 1,
                barRadius: 3,
                height: 120,
                normalize: true,
                backend: 'WebAudio',
            });

            ws.load(version.audio_url);

            ws.on('ready', () => {
                if (!cancelled) {
                    setDuration(ws.getDuration());
                    ws.setVolume(localVolume);
                    setLoadingWaveform(false);
                }
            });

            ws.on('audioprocess', () => {
                if (!cancelled) setCurrentTime(ws.getCurrentTime());
            });

            ws.on('seeking', () => {
                if (!cancelled) setCurrentTime(ws.getCurrentTime());
            });

            ws.on('play', () => { if (!cancelled) setIsPlaying(true); });
            ws.on('pause', () => { if (!cancelled) setIsPlaying(false); });
            ws.on('finish', () => { if (!cancelled) setIsPlaying(false); });

            setWavesurfer(ws);
        }

        initWaveSurfer();

        return () => {
            cancelled = true;
            if (wavesurfer) {
                wavesurfer.destroy();
            }
        };
    }, [isOpen, version?.audio_url, localVolume, isMuted]);

    useEffect(() => {
        if (wavesurfer) {
            wavesurfer.setVolume(isMuted ? 0 : localVolume);
        }
    }, [localVolume, isMuted, wavesurfer]);

    const togglePlay = () => {
        if (wavesurfer) {
            wavesurfer.playPause();
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setLocalVolume(newVolume);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRollback = async () => {
        if (!version) return;
        setRollbacking(true);
        try {
            const res = await fetch(`${URL_API_TESTE}/layer/${layerId}/rollback/${version.id}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (res.ok) {
                onRollback?.();
                onClose();
            } else {
                const data = await res.json();
                alert(data.mensagem || 'Erro ao fazer rollback');
            }
        } catch (err) {
            alert('Erro ao conectar ao servidor');
        } finally {
            setRollbacking(false);
        }
    };

    const handleRestoreInPlace = async () => {
        if (!version) return;
        setRestoringInPlace(true);
        try {
            const res = await fetch(`${URL_API_TESTE}/layer/${layerId}/restore/${version.id}`, {
                method: 'PATCH',
                credentials: 'include'
            });
            if (res.ok) {
                onRestoreInPlace?.();
                onClose();
            } else {
                const data = await res.json();
                alert(data.mensagem || 'Erro ao restaurar vers\u00e3o');
            }
        } catch (err) {
            alert('Erro ao conectar ao servidor');
        } finally {
            setRestoringInPlace(false);
        }
    };

    const startEditTag = () => {
        setTagInput(version?.tag || '');
        setEditingTag(true);
    };

    const cancelEditTag = () => {
        setEditingTag(false);
        setTagInput('');
    };

    const saveTag = async () => {
        if (!version) return;
        setSavingTag(true);
        try {
            await updateVersionTag(layerId, version.id, tagInput.trim() || null);
            onTagUpdate?.();
            setEditingTag(false);
            setTagInput('');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erro ao atualizar tag');
        } finally {
            setSavingTag(false);
        }
    };

    if (!isOpen || !version) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Vers\u00e3o ${version.versionNumber}`} titleId="version-detail-title">
            <div className="version-detail">
                <div className="version-detail-waveform" ref={waveformRef}>
                    {loadingWaveform && (
                        <div className="version-loading-overlay">
                            <Loader2 size={24} className="spin" />
                        </div>
                    )}
                </div>

                <div className="version-detail-controls">
                    <button className="btn-icon" onClick={togglePlay} title={isPlaying ? 'Pausar' : 'Reproduzir'}>
                        {isPlaying ? <Volume2 size={18} /> : <Volume2 size={18} />}
                    </button>
                    <button className={`btn-icon ${isMuted ? 'active' : ''}`} onClick={toggleMute} title={isMuted ? 'Ativar som' : 'Silenciar'}>
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
                    <div className="track-time">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="version-detail-meta">
                    <div><strong>Autor:</strong> {version.autor.nome_completo}</div>
                    <div><strong>Data:</strong> {formatDate(version.createdAt)}</div>
                    <div className="version-tag-row">
                        <strong>Tag:</strong>
                        {editingTag ? (
                            <div className="tag-edit-inline">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && saveTag()}
                                    onBlur={saveTag}
                                    placeholder="Ex: v1.0-mix, pré-master"
                                    maxLength={50}
                                    autoFocus
                                    className="tag-input"
                                />
                                <button className="btn-icon" onClick={saveTag} disabled={savingTag} title="Salvar">
                                    {savingTag ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                                </button>
                                <button className="btn-icon" onClick={cancelEditTag} title="Cancelar">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className={`version-tag-display ${version.tag ? 'has-tag' : ''}`}>
                                    {version.tag || '—'}
                                </span>
                                <button
                                    className="btn-icon btn-edit-tag"
                                    onClick={startEditTag}
                                    title="Editar tag"
                                    disabled={savingTag}
                                >
                                    <Tag size={14} />
                                </button>
                            </>
                        )}
                    </div>
                    <div><strong>Mensagem:</strong> {version.mensagem || '\u2014'}</div>
                    <div><strong>Delay:</strong> {version.delay_offset}ms</div>
                    <div><strong>Volume:</strong> {Math.round(version.volume_padrao * 100)}%</div>
                    <div><strong>Instrumento:</strong> {version.instrumento_tag}</div>
                    <div><strong>Nome da trilha:</strong> {version.nome_trilha}</div>
                </div>

                <div className="version-detail-actions">
                    <button
                        className="btn-secondary"
                        onClick={handleRollback}
                        disabled={rollbacking || restoringInPlace}
                    >
                        {rollbacking ? <Loader2 size={14} className="spin" /> : <RotateCcw size={14} />}
                        Restaurar (nova vers\u00e3o)
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleRestoreInPlace}
                        disabled={restoringInPlace || rollbacking}
                    >
                        {restoringInPlace ? <Loader2 size={14} className="spin" /> : <Undo2 size={14} />}
                        Restaurar (in-place)
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export { VersionDetailModal };