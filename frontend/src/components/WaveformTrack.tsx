import { useEffect, useRef, useState, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, Save, Loader2, Trash2, History, Pencil, Bookmark, MessageSquare } from 'lucide-react';
import { LayerVersionPanel } from './LayerVersionPanel';
import { VersionDetailModal } from './VersionDetailModal';
import { BranchSelector } from './BranchSelector';
import { createManualVersion } from '../utility/branchApi';
import { useComentarios, type Comentario } from '../hooks/useComentarios';
import { ComentariosCamada, formatarTempo } from './ComentariosCamada';
import { pode, type PapelEfetivo } from '../utility/papeis';
import type { PlaybackEngine } from '../utility/playbackEngine';
import { usePlaybackFrame } from '../hooks/usePlayback';
import { delaySeconds } from '../utility/playbackMath';

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
    /** Motor que toca todas as faixas; o wavesurfer aqui só desenha a forma de onda. */
    engine: PlaybackEngine
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
    /** Dono ou produtor: pode aprovar/rejeitar a camada. */
    canApprove?: boolean
    isLayerAuthor?: boolean
    /** Papel de quem está vendo o projeto (habilita os comentários). */
    meuPapel?: PapelEfetivo | null
    usuarioId?: string
    totalVersoes?: number
    versaoAtual?: { id?: string; numero: number } | null
    onSave?: (layerId: string, changes: LayerChanges) => void
    onAuthorize?: (layerId: string, aprovada: boolean) => void
    onDelete?: (layerId: string, layerName: string) => void
    onEdit?: (layerId: string) => void
    onVersionChange?: () => void
    saving?: boolean
}

function WaveformTrackInner({
    engine,
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
    canApprove = false,
    isLayerAuthor = false,
    meuPapel = null,
    usuarioId,
    totalVersoes = 0,
    versaoAtual = null,
    onSave,
    onAuthorize,
    onDelete,
    onEdit,
    onVersionChange,
    saving = false
}: WaveformTrackProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [audioErro, setAudioErro] = useState(false);
    const wavesurferRef = useRef<any>(null);
    // Tempo (da camada) só em estado quando o painel de comentários precisa dele; o relógio da faixa vai direto no DOM.
    const [currentTime, setCurrentTime] = useState(0);
    const timeLabelRef = useRef<HTMLSpanElement | null>(null);
    const readyRef = useRef(false);
    const lastCommentClock = useRef(0);
    const [duration, setDuration] = useState(0);
    const [localVolume, setLocalVolume] = useState(volume);
    const [isMuted, setIsMuted] = useState(false);
    const [localDelay, setLocalDelay] = useState(delayOffset);
    const [hasChanges, setHasChanges] = useState(false);
    const [versionPanelOpen, setVersionPanelOpen] = useState(false);
    const [detailVersion, setDetailVersion] = useState<Version | null>(null);
    const [comentariosAbertos, setComentariosAbertos] = useState(false);
    const [destacadoId, setDestacadoId] = useState<string | null>(null);

    const podeComentar = !isGuia && pode(meuPapel, 'comentar');
    const { comentarios, erro: comentariosErro, criar, alternarResolvido, remover } = useComentarios(layerId, podeComentar);
    const emAberto = comentarios.filter(c => !c.resolvido);
    const podeResolver = (c: Comentario) =>
        c.autor.id === usuarioId || isLayerAuthor || meuPapel === 'DONO' || meuPapel === 'PRODUTOR';
    const podeRemover = (c: Comentario) => c.autor.id === usuarioId || meuPapel === 'DONO';

    const color = COLORS[colorIndex % COLORS.length];

    // Valores mais recentes para registrar a faixa no motor assim que o áudio estiver decodificado.
    const latest = useRef({ delay: localDelay, volume: localVolume, muted: isMuted });
    useEffect(() => { latest.current = { delay: localDelay, volume: localVolume, muted: isMuted }; });
    const durationRef = useRef(0);
    useEffect(() => { durationRef.current = duration; }, [duration]);

    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        let cancelled = false;
        readyRef.current = false;

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
                if (cancelled) return;

                // O motor reaproveita o áudio que o wavesurfer já decodificou (sem baixar de novo).
                const decoded = wavesurfer.getDecodedData();
                if (!decoded) {
                    setAudioErro(true);
                    return;
                }

                setAudioErro(false);
                setDuration(wavesurfer.getDuration());
                readyRef.current = true;
                engine.registerTrack(layerId, decoded, {
                    delayMs: latest.current.delay,
                    volume: latest.current.volume,
                    muted: latest.current.muted,
                });
            });

            // Clicar na forma de onda leva a reprodução de TODAS as faixas para aquele ponto.
            wavesurfer.on('interaction', (newTime: number) => {
                if (!cancelled) engine.seek(newTime + delaySeconds(latest.current.delay));
            });

            wavesurferRef.current = wavesurfer;
        }

        initWaveSurfer();

        return () => {
            cancelled = true;
            readyRef.current = false;
            engine.unregisterTrack(layerId);
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
        };
    }, [audioUrl, color, layerId, engine]);

    // Volume, mute e delay valem ao vivo no motor, inclusive antes de salvar.
    useEffect(() => {
        engine.updateTrack(layerId, { delayMs: localDelay, volume: localVolume, muted: isMuted });
    }, [engine, layerId, localDelay, localVolume, isMuted]);

    // Cursor e relógio da faixa seguem a posição global (já descontado o delay desta camada).
    const playback = usePlaybackFrame(engine, position => {
        const local = Math.min(Math.max(0, position - delaySeconds(localDelay)), durationRef.current);

        if (readyRef.current) wavesurferRef.current?.setTime(local);
        if (timeLabelRef.current) timeLabelRef.current.textContent = formatarTempo(local);

        // O painel de comentários precisa do tempo em estado, mas sem re-renderizar a cada quadro.
        if (comentariosAbertos) {
            const now = performance.now();
            if (!engine.getState().playing || now - lastCommentClock.current > 250) {
                lastCommentClock.current = now;
                setCurrentTime(local);
            }
        }
    });
    const tocandoEstaSozinha = playback.playing && playback.soloId === layerId;

    const togglePlay = () => {
        engine.playSolo(layerId);
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

    const formatTime = formatarTempo;

    // `segundos` é tempo da camada; na linha do tempo global ele vem somado ao delay.
    const irPara = (segundos: number) => {
        engine.seek(segundos + delaySeconds(localDelay));
        setCurrentTime(segundos);
    };

    const abrirComentario = (c: Comentario) => {
        irPara(c.segundos);
        setDestacadoId(c.id);
        setComentariosAbertos(true);
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
                        title={tocandoEstaSozinha ? 'Pausar' : 'Ouvir só esta camada'}
                        aria-label={tocandoEstaSozinha ? 'Pausar' : 'Ouvir só esta camada'}
                    >
                        {tocandoEstaSozinha ? <Pause size={18} /> : <Play size={18} />}
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
                        {podeComentar && (
                            <button
                                className={`btn-version-history${comentariosAbertos ? ' active' : ''}`}
                                onClick={() => setComentariosAbertos(v => !v)}
                                title={`Comentários (${emAberto.length} em aberto)`}
                                aria-expanded={comentariosAbertos}
                            >
                                <MessageSquare size={14} />
                                {emAberto.length}
                            </button>
                        )}
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
                        {canApprove && (
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
                            </>
                        )}
                        {isOwner && (
                            <>
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
            <div className="waveform-wrap">
                <div className="waveform-container" ref={containerRef}></div>
                {podeComentar && duration > 0 && emAberto.map(c => (
                    <button
                        key={c.id}
                        className={`comentario-marker${c.id === destacadoId ? ' destacado' : ''}`}
                        style={{ left: `${Math.min(100, (c.segundos / duration) * 100)}%` }}
                        onClick={() => abrirComentario(c)}
                        title={`${formatarTempo(c.segundos)} · ${c.autor.nome_completo}: ${c.texto}`}
                        aria-label={`Comentário em ${formatarTempo(c.segundos)}`}
                    />
                ))}
            </div>
            {audioErro && (
                <p className="error-msg">Não foi possível carregar o áudio. Recarregue a página para atualizar o acesso.</p>
            )}
            <div className="track-time">
                <span ref={timeLabelRef}>0:00</span>
                <span>{formatTime(duration)}</span>
            </div>

            {podeComentar && comentariosAbertos && (
                <ComentariosCamada
                    comentarios={comentarios}
                    erro={comentariosErro}
                    currentTime={currentTime}
                    versaoAtual={versaoAtual?.numero}
                    destacadoId={destacadoId}
                    podeComentar={podeComentar}
                    podeResolver={podeResolver}
                    podeRemover={podeRemover}
                    onSeek={irPara}
                    onCriar={criar}
                    onAlternarResolvido={alternarResolvido}
                    onRemover={remover}
                />
            )}

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
