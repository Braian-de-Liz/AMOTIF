import { useCallback, useEffect, useRef, useState, memo } from 'react';
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
import { renderStretched } from '../utility/stretchRender';
import { computeStretchRatio, isQualityRisk, MIN_RATIO } from '../utility/tempo';
import { useFeedback } from '../contexts/FeedbackContext';
import { ActionMenu } from './ActionMenu';

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
    /** Só vai quando a velocidade foi mexida; null = volta ao BPM do projeto. */
    bpm_original?: number | null
}

/** Teto do controle de velocidade: acima de √2 o cálculo de tempo (computeStretchRatio) trataria como meio-tempo. */
const MAX_SPEED = 1.4;
const SPEED_STEP = 0.05;
const RENDER_DEBOUNCE_MS = 300;

interface WaveformTrackProps {
    /** Motor que toca todas as faixas; o wavesurfer aqui só desenha a forma de onda. */
    engine: PlaybackEngine
    audioUrl?: string
    nome?: string
    autor?: string
    layerId: string
    delayOffset?: number
    volume?: number
    /** BPM do projeto e BPM em que esta camada foi gravada: definem a velocidade salva. */
    projectBpm?: number
    bpmOriginal?: number | null
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
    /** Resolve `true` quando o servidor aceitou as alterações. */
    onSave?: (layerId: string, changes: LayerChanges) => Promise<boolean> | void
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
    projectBpm,
    bpmOriginal = null,
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
    const feedback = useFeedback();
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
    // Velocidade da camada (1 = original; >1 acelera). Preserva a afinação.
    const [localRate, setLocalRate] = useState(() => Math.min(MAX_SPEED, Math.max(MIN_RATIO, computeStretchRatio(projectBpm ?? 0, bpmOriginal))));
    const [rateTouched, setRateTouched] = useState(false);
    const [rendering, setRendering] = useState(false);
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

    // Ajustes de volume/delay ainda não salvos se perdem ao fechar a aba.
    useEffect(() => {
        if (!hasChanges) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [hasChanges]);

    // Valores mais recentes para registrar a faixa no motor assim que o áudio estiver decodificado.
    const latest = useRef({ delay: localDelay, volume: localVolume, muted: isMuted, rate: localRate });
    useEffect(() => { latest.current = { delay: localDelay, volume: localVolume, muted: isMuted, rate: localRate }; });
    // Áudio decodificado original e velocidade já aplicada ao que está no motor.
    const decodedRef = useRef<AudioBuffer | null>(null);
    const renderToken = useRef(0);
    const [appliedRate, setAppliedRate] = useState(1);
    const appliedRef = useRef(1);

    // Troca o áudio do motor por uma versão acelerada/desacelerada (afinação preservada).
    const applyRate = useCallback(async (rate: number) => {
        const decoded = decodedRef.current;
        if (!decoded) return;

        const token = ++renderToken.current;
        setRendering(true);
        try {
            const buffer = await renderStretched(decoded, rate, 0);
            if (token !== renderToken.current) return;
            appliedRef.current = rate;
            setAppliedRate(rate);
            engine.registerTrack(layerId, buffer);
        } catch (err) {
            if (token !== renderToken.current) return;
            console.error(err);
            feedback.error(err instanceof Error ? err.message : 'Não foi possível ajustar a velocidade.');
        } finally {
            if (token === renderToken.current) setRendering(false);
        }
    }, [engine, layerId, feedback]);

    // Mexer na velocidade re-renderiza só depois que o usuário para de arrastar.
    useEffect(() => {
        if (!decodedRef.current || localRate === appliedRef.current) return;
        const timer = setTimeout(() => { void applyRate(localRate); }, RENDER_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [localRate, applyRate]);

    useEffect(() => () => { renderToken.current++; }, []);    const durationRef = useRef(0);
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
                decodedRef.current = decoded;
                appliedRef.current = 1;
                setAppliedRate(1);
                engine.registerTrack(layerId, decoded, {
                    delayMs: latest.current.delay,
                    volume: latest.current.volume,
                    muted: latest.current.muted,
                });
                // Camada salva com outra velocidade: troca para a versão ajustada assim que ficar pronta.
                if (latest.current.rate !== 1) void applyRate(latest.current.rate);
            });

            // Clicar na forma de onda leva a reprodução de TODAS as faixas para aquele ponto.
            wavesurfer.on('interaction', (newTime: number) => {
                if (!cancelled) engine.seek(newTime / appliedRef.current + delaySeconds(latest.current.delay));
            });

            wavesurferRef.current = wavesurfer;
        }

        initWaveSurfer();

        return () => {
            cancelled = true;
            readyRef.current = false;
            decodedRef.current = null;
            renderToken.current++;
            engine.unregisterTrack(layerId);
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
        };
    }, [audioUrl, color, layerId, engine, applyRate]);

    // Volume, mute e delay valem ao vivo no motor, inclusive antes de salvar.
    useEffect(() => {
        engine.updateTrack(layerId, { delayMs: localDelay, volume: localVolume, muted: isMuted });
    }, [engine, layerId, localDelay, localVolume, isMuted]);

    // Cursor e relógio da faixa seguem a posição global (já descontado o delay desta camada).
    const playback = usePlaybackFrame(engine, position => {
        // Outra camada tocando sozinha: esta fica parada, sem cursor nem relógio andando.
        const { playing, soloId } = engine.getState();
        if (playing && soloId !== null && soloId !== layerId) return;

        // `local` é o tempo tocado (já com a velocidade); `original` é o ponto correspondente no áudio gravado.
        const rate = appliedRef.current;
        const local = Math.min(Math.max(0, position - delaySeconds(localDelay)), durationRef.current / rate);
        const original = local * rate;

        if (readyRef.current) wavesurferRef.current?.setTime(original);
        if (timeLabelRef.current) timeLabelRef.current.textContent = formatarTempo(local);

        // O painel de comentários precisa do tempo em estado, mas sem re-renderizar a cada quadro.
        if (comentariosAbertos) {
            const now = performance.now();
            if (!engine.getState().playing || now - lastCommentClock.current > 250) {
                lastCommentClock.current = now;
                setCurrentTime(original);
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

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalRate(parseFloat(e.target.value));
        setRateTouched(true);
        setHasChanges(true);
    };

    const resetRate = () => {
        setLocalRate(1);
        setRateTouched(true);
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
        engine.seek(segundos / appliedRef.current + delaySeconds(localDelay));
        setCurrentTime(segundos);
    };

    const abrirComentario = (c: Comentario) => {
        irPara(c.segundos);
        setDestacadoId(c.id);
        setComentariosAbertos(true);
    };

    const handleSave = async () => {
        if (!onSave) return;
        const ok = await onSave(layerId, {
            volume_padrao: localVolume,
            delay_offset: localDelay,
            // Só manda o BPM quando a velocidade foi mexida, para não sobrescrever o que já estava salvo.
            ...(rateTouched && projectBpm
                ? { bpm_original: localRate === 1 ? null : Math.min(300, Math.max(20, Math.round(projectBpm / localRate))) }
                : {}),
        });
        // Só limpa o aviso se o servidor aceitou; `void` (sem retorno) conta como salvo.
        if (ok !== false) { setHasChanges(false); setRateTouched(false); }
    };

    const [savingVersion, setSavingVersion] = useState(false);

    const handleSaveVersion = async () => {
        setSavingVersion(true);
        try {
            await createManualVersion(layerId, {
                mensagem: `Commit manual - ${new Date().toLocaleString('pt-BR')}`,
                tag: undefined
            });
            feedback.success('Versão salva.');
            onVersionChange?.();
        } catch (err) {
            feedback.error(err instanceof Error ? err.message : 'Erro ao criar versão');
        } finally {
            setSavingVersion(false);
        }
    };

    return (
        <div
            className={`waveform-track${!isGuia && !estaAprovada ? ' is-pending' : ''}${isGuia ? ' is-guide' : ''}`}
            style={{ '--track-color': color } as React.CSSProperties}
        >
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
                        title={isMuted ? 'Ativar som' : 'Silenciar'} aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
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
                        aria-label={`Volume de ${nome || 'faixa'}`}
                        aria-valuetext={`${Math.round(localVolume * 100)}%`}
                    />
                    <span className="volume-value" aria-hidden="true">{Math.round(localVolume * 100)}%</span>
                    {!isGuia && (
                        <div className="delay-control">
                            <label htmlFor={`delay-${layerId}`}>Delay (ms):</label>
                            <input
                                id={`delay-${layerId}`}
                                type="number"
                                value={localDelay}
                                onChange={handleDelayChange}
                                className="delay-input"
                                placeholder="0"
                            />
                        </div>
                    )}
                    {!isGuia && !!projectBpm && (
                        <div className="speed-control">
                            <label htmlFor={`speed-${layerId}`}>Velocidade:</label>
                            <input
                                id={`speed-${layerId}`}
                                type="range"
                                min={MIN_RATIO}
                                max={MAX_SPEED}
                                step={SPEED_STEP}
                                value={localRate}
                                onChange={handleRateChange}
                                onDoubleClick={resetRate}
                                className="speed-slider"
                                title={isQualityRisk(localRate) ? 'Ajustes grandes podem reduzir a qualidade do áudio. Clique duas vezes para voltar a 100%.' : 'Clique duas vezes para voltar a 100%.'}
                                aria-valuetext={`${Math.round(localRate * 100)}%`}
                            />
                            <span className="volume-value" aria-live="polite">
                                {rendering ? <Loader2 size={12} className="spin" /> : `${Math.round(localRate * 100)}%`}
                            </span>
                        </div>
                    )}
                    {!isGuia && hasChanges && (
                        <button className="btn-save btn-save-labeled" onClick={handleSave} disabled={saving} title="Salvar volume, delay e velocidade desta camada">
                            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                            <span>{saving ? 'Salvando…' : 'Salvar ajustes'}</span>
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
                        {(isOwner || isCollaborator) && (
                            <ActionMenu
                                label="Mais ações da camada"
                                items={[
                                    {
                                        label: 'Salvar versão atual',
                                        icon: savingVersion ? <Loader2 size={14} className="spin" /> : <Bookmark size={14} />,
                                        disabled: savingVersion,
                                        onSelect: handleSaveVersion,
                                    },
                                    { label: 'Editar áudio', icon: <Pencil size={14} />, onSelect: () => onEdit?.(layerId) },
                                    ...(isOwner
                                        ? [{ label: 'Excluir camada', icon: <Trash2 size={14} />, danger: true, onSelect: () => onDelete?.(layerId, nome || 'Track') }]
                                        : []),
                                ]}
                            />
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
                <span>{formatTime(duration / appliedRate)}</span>
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
