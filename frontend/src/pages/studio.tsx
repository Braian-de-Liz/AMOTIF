import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { WaveformTrack } from "../components/WaveformTrack";
import { StudioMural } from "../components/StudioMural";
import { StudioSugestoes } from "../components/StudioSugestoes";
import { StudioColaboradores } from "../components/StudioColaboradores";
import { EditProjectModal } from "../components/EditProjectModal";
import { DeleteProjectModal } from "../components/DeleteProjectModal";
import { DeleteLayerModal } from "../components/DeleteLayerModal";
import { LayerEditorModal } from "../components/LayerEditorModal";
import { URL_API_TESTE } from "../utility/url_apis";
import { TransportBar } from "../components/TransportBar";
import { usePlayback } from "../hooks/usePlayback";
import { Mic, Music, Users, MessageSquare, Lightbulb, Pencil, Trash2, Download } from "lucide-react";
import { ActionMenu } from "../components/ActionMenu";
import { WaveArt } from "../components/WaveArt";
import { mixdown, downloadBlob, type MixdownFormat } from "../utility/mixdown";
import type { Project, Camada } from "../types";
import { useUserData } from "../contexts/UserDataContext";
import '../styles/Studio.css';
import '../styles/StudioPolish.css';
import { SEOHead } from '../components/SEOHead';
import { pode, rotuloPapel, rotuloStatus } from "../utility/papeis";
import { useFeedback } from "../contexts/FeedbackContext";

function Studio() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [projeto, setProjeto] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('tracks');
    const [exporting, setExporting] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteLayerTarget, setDeleteLayerTarget] = useState<{ id: string; nome: string } | null>(null);
    const [editLayerTarget, setEditLayerTarget] = useState<{ id: string; audioUrl: string; nome: string } | null>(null);
    const { usuario } = useUserData();
    const feedback = useFeedback();

    // Um único motor toca todas as faixas (respeitando delay, volume e mute de cada uma).
    const engine = usePlayback();

    useEffect(() => {
        async function carregarProjeto() {
            try {
                const response = await fetch(`${URL_API_TESTE}/projetos/${id}`, {
                    credentials: 'include'
                });

                const data = await response.json();

                if (response.ok) {
                    setProjeto(data.projeto || data);
                } else {
                    setErro(data.mensagem || "Erro ao carregar projeto.");
                }
            } catch (err) {
                setErro("Não foi possível conectar ao servidor do Studio.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (id) carregarProjeto();
    }, [id]);

    const refetchProjeto = useCallback(async () => {
        if (!id) return;
        try {
            const response = await fetch(`${URL_API_TESTE}/projetos/${id}`, { credentials: 'include' });
            const data = await response.json();
            if (response.ok) setProjeto(data.projeto || data);
        } catch (err) {
            console.error(err);
        }
    }, [id]);

    // Exporta o guia + camadas aprovadas, com o volume e o delay de cada uma.
    const handleExport = useCallback(async (formato: MixdownFormat) => {
        if (!projeto) return;
        const aprovadas = (projeto.camadas || []).filter(c => c.esta_aprovada);
        if (aprovadas.length === 0) {
            feedback.info("Aprove ao menos uma camada para exportar o mix.");
            return;
        }

        setExporting(true);
        try {
            const mix = await mixdown([
                ...(projeto.audio_guia ? [{ url: projeto.audio_guia, delayMs: 0, volume: 1, label: 'Áudio guia' }] : []),
                ...aprovadas.map(c => ({ url: c.audio_url, delayMs: c.delay_offset, volume: c.volume_padrao, label: c.nome_trilha })),
            ], formato);
            downloadBlob(mix, `${projeto.titulo.normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'mix'}.${formato}`);
        } catch (err) {
            console.error(err);
            const motivo = err instanceof Error ? err.message : '';
            feedback.error(motivo ? `Não foi possível gerar o mix: ${motivo}.` : "Não foi possível gerar o mix. Tente novamente.");
        } finally {
            setExporting(false);
        }
    }, [projeto, feedback]);

    const handleSaveLayer = useCallback(async (layerId: string, changes: { volume_padrao: number; delay_offset: number }): Promise<boolean> => {
        setSaving(layerId);
        try {
            const response = await fetch(`${URL_API_TESTE}/layer/${layerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(changes)
            });

            if (response.ok) {
                setProjeto(prev => prev ? {
                    ...prev,
                    camadas: (prev.camadas || []).map(c =>
                        c.id === layerId ? { ...c, ...changes } : c
                    )
                } : prev);
                feedback.success('Ajustes salvos.');
                return true;
            }
            feedback.error('Erro ao salvar alterações');
            return false;
        } catch (err) {
            console.error('Erro ao salvar:', err);
            feedback.error('Erro ao salvar alterações');
            return false;
        } finally {
            setSaving(null);
        }
    }, [feedback]);

    const handleAuthorizeLayer = useCallback(async (layerId: string, aprovada: boolean) => {
        try {
            const response = await fetch(`${URL_API_TESTE}/layer/${layerId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ aprovada })
            });

            const data = await response.json();

            if (response.ok) {
                setProjeto(prev => prev ? {
                    ...prev,
                    camadas: (prev.camadas || []).map(c =>
                        c.id === layerId ? { ...c, esta_aprovada: aprovada } : c
                    )
                } : prev);
                feedback.success(aprovada ? 'Camada aprovada.' : 'Camada rejeitada.');
            } else {
                feedback.error(data.mensagem || 'Erro ao atualizar status da camada');
            }
        } catch (err) {
            console.error('Erro ao autorizar camada:', err);
            feedback.error('Erro ao conectar ao servidor');
        }
    }, [feedback]);

    // O papel vem da API (meu_papel); a comparação com o autor cobre respostas antigas sem o campo.
    const meuPapel = projeto?.meu_papel ?? null;
    const isOwner = meuPapel === 'DONO' || (!!usuario?.id && projeto?.autor?.id === usuario.id);
    const isCollaborator = meuPapel === 'PRODUTOR' || meuPapel === 'MUSICO';
    const podeEnviar = isOwner || pode(meuPapel, 'enviarCamada');
    const podeAprovar = isOwner || pode(meuPapel, 'aprovarCamada');

    const handleDeleteLayer = useCallback((layerId: string, layerName: string) => {
        setDeleteLayerTarget({ id: layerId, nome: layerName });
    }, []);

    const handleEditLayer = useCallback((layerId: string) => {
        const camada = projeto?.camadas?.find(c => c.id === layerId);
        if (camada) {
            setEditLayerTarget({
                id: camada.id,
                audioUrl: camada.audio_url,
                nome: camada.instrumento_tag || 'Track'
            });
        }
    }, [projeto]);

    const handleLayerVersionCreated = useCallback(() => {
        setEditLayerTarget(null);
        refetchProjeto();
    }, [refetchProjeto]);

    const handleLayerDeleted = useCallback(() => {
        setDeleteLayerTarget(null);
        refetchProjeto();
    }, [refetchProjeto]);

    const handleProjectUpdated = useCallback((updated: Project) => {
        setProjeto(prev => prev ? { ...prev, ...updated } : prev);
    }, []);

    if (loading) {
        return (
            <div className="studio-loading" role="status" aria-live="polite">
                <WaveArt variant="skeleton" bars={48} />
                <p>Montando o setup do estúdio…</p>
            </div>
        );
    }
    if (erro) return <div className="error-msg">{erro}</div>;
    if (!projeto) return <div className="error-msg">Projeto não encontrado.</div>;

    const camadasPendentes = (projeto.camadas || []).filter(c => !c.esta_aprovada).length;
    const tabs: { id: string; label: string; icon: React.ReactNode; count?: number; alert?: boolean }[] = [
        { id: 'tracks', label: 'Tracks', icon: <Music size={18} />, count: (projeto.camadas || []).length + 1 },
        { id: 'mural', label: 'Mural', icon: <MessageSquare size={18} /> },
        { id: 'sugestoes', label: 'Sugestões', icon: <Lightbulb size={18} /> },
        { id: 'colaboradores', label: 'Colaboradores', icon: <Users size={18} /> },
    ];
    // Quem aprova vê quantas camadas esperam por ele na própria aba.
    if (podeAprovar && camadasPendentes > 0) {
        tabs[0] = { ...tabs[0], count: camadasPendentes, alert: true, label: 'Tracks pendentes' };
    }

    // Setas/Home/End movem entre abas (padrão WAI-ARIA para tablist).
    const onTabKeyDown = (e: React.KeyboardEvent, current: string) => {
        const index = tabs.findIndex(t => t.id === current);
        let next = index;
        if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        else return;
        e.preventDefault();
        setActiveTab(tabs[next].id);
        document.getElementById(`studio-tab-${tabs[next].id}`)?.focus();
    };

    return (
        <div className="studio-page">
            <SEOHead
                title={`Estúdio: ${projeto.titulo}`}
                description={`Estúdio do projeto "${projeto.titulo}" - BPM: ${projeto.bpm}${projeto.genero ? `, Gênero: ${projeto.genero}` : ''}. Colabore em tempo real.`}
                url={`/studio/${id}`}
            />
            <header className="studio-header">
                <div className="studio-header-main">
                    <p className="studio-eyebrow">Estúdio</p>
                    <h1>{projeto.titulo}</h1>
                    <div className="studio-chips">
                        <span className="chip chip-mono" title="Andamento do projeto">{projeto.bpm} BPM</span>
                        {projeto.escala && <span className="chip chip-mono" title="Tonalidade">{projeto.escala}</span>}
                        {projeto.genero && <span className="chip">{projeto.genero}</span>}
                        <span className={`status-projeto status-${(projeto.status ?? 'IDEIA').toLowerCase()}`}>{rotuloStatus(projeto.status)}</span>
                        {meuPapel && <span className={`papel-badge papel-${meuPapel.toLowerCase()}`}>Você: {rotuloPapel(meuPapel)}</span>}
                    </div>
                </div>

                <div className="studio-header-actions">
                    {podeEnviar && (
                        <button className="btn-primary-studio" onClick={() => navigate(`/studio/${id}/gravar`)}>
                            <Mic size={18} /> Gravar
                        </button>
                    )}
                    <button className="btn-secondary-studio" onClick={() => handleExport('mp3')} disabled={exporting}>
                        <Download size={18} /> {exporting ? 'Gerando...' : 'Exportar MP3'}
                    </button>
                    <ActionMenu
                        label="Mais ações do projeto"
                        triggerClassName="btn-secondary-studio btn-icon-only"
                        items={[
                            { label: 'Exportar WAV (sem perdas)', icon: <Download size={14} />, disabled: exporting, onSelect: () => handleExport('wav') },
                            ...(isOwner ? [
                                { label: 'Editar projeto', icon: <Pencil size={14} />, onSelect: () => setEditModalOpen(true) },
                                { label: 'Excluir projeto', icon: <Trash2 size={14} />, danger: true, onSelect: () => setDeleteModalOpen(true) },
                            ] : []),
                        ]}
                    />
                </div>

                <WaveArt className="studio-header-wave" bars={90} />
            </header>

            <div className="studio-tabs" role="tablist" aria-label="Seções do estúdio">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        id={`studio-tab-${tab.id}`}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`studio-panel-${tab.id}`}
                        tabIndex={activeTab === tab.id ? 0 : -1}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        onKeyDown={e => onTabKeyDown(e, tab.id)}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`tab-count${tab.alert ? ' alert' : ''}`}>{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            <main className="studio-content" role="tabpanel" id={`studio-panel-${activeTab}`} aria-labelledby={`studio-tab-${activeTab}`}>
                {/* As faixas continuam montadas (só escondidas) nas outras abas: a música não para ao trocar de aba. */}
                <div className="studio-tracks" style={activeTab === 'tracks' ? undefined : { display: 'none' }}>
                        <WaveformTrack
                            engine={engine}
                            audioUrl={projeto.audio_guia}
                            nome="Áudio Guia"
                            autor={projeto.autor?.nome_completo}
                            layerId="__guide__"
                            delayOffset={0}
                            volume={1.0}
                            colorIndex={0}
                            isGuia={true}
                        />

                        {(projeto.camadas || []).length === 0 && (
                            <div className="studio-empty">
                                <WaveArt bars={36} />
                                <h3>Nenhuma camada ainda</h3>
                                <p>O áudio guia já está pronto. {podeEnviar ? 'Grave a primeira camada e comece a construir a música.' : 'Quando alguém gravar, as camadas aparecem aqui.'}</p>
                                {podeEnviar && (
                                    <button className="btn-primary-studio" onClick={() => navigate(`/studio/${id}/gravar`)}>
                                        <Mic size={18} /> Gravar a primeira camada
                                    </button>
                                )}
                            </div>
                        )}

                        {(projeto.camadas || []).map((camada: Camada, index: number) => (
                            <WaveformTrack
                                key={camada.id}
                                engine={engine}
                                audioUrl={camada.audio_url}
                                nome={camada.instrumento_tag}
                                autor={camada.autor?.nome_completo}
                                layerId={camada.id}
                                delayOffset={camada.delay_offset}
                                volume={camada.volume_padrao}
                                colorIndex={index + 1}
                                isGuia={false}
                                estaAprovada={camada.esta_aprovada}
                                isOwner={isOwner}
                                isCollaborator={isCollaborator}
                                canApprove={podeAprovar}
                                isLayerAuthor={!!usuario?.id && camada.autor?.id === usuario.id}
                                meuPapel={isOwner ? 'DONO' : meuPapel}
                                usuarioId={usuario?.id}
                                totalVersoes={camada.totalVersoes || 0}
                                versaoAtual={camada.versaoAtual || null}
                                saving={saving === camada.id}
                                onSave={handleSaveLayer}
                                onAuthorize={handleAuthorizeLayer}
                                onDelete={handleDeleteLayer}
                                onEdit={handleEditLayer}
                                onVersionChange={refetchProjeto}
                            />
                        ))}
                </div>

                {activeTab === 'mural' && (
                    <StudioMural projetoId={id} isOwner={isOwner} />
                )}

                {activeTab === 'sugestoes' && (
                    <StudioSugestoes projetoId={id} isOwner={isOwner} />
                )}

                {activeTab === 'colaboradores' && (
                    <StudioColaboradores projetoId={id} isOwner={isOwner} />
                )}
            </main>

            {projeto && (
                <EditProjectModal
                    projeto={projeto}
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    onUpdated={handleProjectUpdated}
                />
            )}

            <DeleteProjectModal
                projetoId={id || ''}
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
            />


            <TransportBar engine={engine} />

            {deleteLayerTarget && (
                <DeleteLayerModal
                    layerId={deleteLayerTarget.id}
                    layerName={deleteLayerTarget.nome}
                    isOpen={!!deleteLayerTarget}
                    onClose={() => setDeleteLayerTarget(null)}
                    onDeleted={handleLayerDeleted}
                />
            )}

            {editLayerTarget && (
                <LayerEditorModal
                    layerId={editLayerTarget.id}
                    audioUrl={editLayerTarget.audioUrl}
                    nomeTrilha={editLayerTarget.nome}
                    isOpen={!!editLayerTarget}
                    onClose={() => setEditLayerTarget(null)}
                    onVersionCreated={handleLayerVersionCreated}
                />
            )}
        </div>
    );
}

export { Studio };
