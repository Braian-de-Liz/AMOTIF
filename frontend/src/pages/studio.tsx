import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { WaveformTrack } from "../components/WaveformTrack";
import { StudioMural } from "../components/StudioMural";
import { StudioSugestoes } from "../components/StudioSugestoes";
import { StudioColaboradores } from "../components/StudioColaboradores";
import { EditProjectModal } from "../components/EditProjectModal";
import { DeleteProjectModal } from "../components/DeleteProjectModal";
import { CreateLayerModal } from "../components/CreateLayerModal";
import { DeleteLayerModal } from "../components/DeleteLayerModal";
import { LayerEditorModal } from "../components/LayerEditorModal";
import { URL_API_TESTE } from "../utility/url_apis";
import { TransportBar } from "../components/TransportBar";
import { usePlayback } from "../hooks/usePlayback";
import { Mic, Music, Users, MessageSquare, Lightbulb, Pencil, Trash2, Download } from "lucide-react";
import { mixdownToWav, downloadBlob } from "../utility/mixdown";
import type { Project, Camada } from "../types";
import { useUserData } from "../contexts/UserDataContext";
import '../styles/Studio.css';
import { SEOHead } from '../components/SEOHead';
import { pode, rotuloPapel, rotuloStatus } from "../utility/papeis";

function Studio() {
    const { id } = useParams<{ id: string }>();
    const [projeto, setProjeto] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('tracks');
    const [saveErro, setSaveErro] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [createLayerModalOpen, setCreateLayerModalOpen] = useState(false);
    const [deleteLayerTarget, setDeleteLayerTarget] = useState<{ id: string; nome: string } | null>(null);
    const [editLayerTarget, setEditLayerTarget] = useState<{ id: string; audioUrl: string; nome: string } | null>(null);
    const { usuario } = useUserData();

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
    const handleExport = useCallback(async () => {
        if (!projeto) return;
        const aprovadas = (projeto.camadas || []).filter(c => c.esta_aprovada);
        if (aprovadas.length === 0) {
            setSaveErro("Aprove ao menos uma camada para exportar o mix.");
            return;
        }

        setExporting(true);
        setSaveErro(null);
        try {
            const wav = await mixdownToWav([
                ...(projeto.audio_guia ? [{ url: projeto.audio_guia, delayMs: 0, volume: 1, label: 'Áudio guia' }] : []),
                ...aprovadas.map(c => ({ url: c.audio_url, delayMs: c.delay_offset, volume: c.volume_padrao, label: c.nome_trilha })),
            ]);
            downloadBlob(wav, `${projeto.titulo.normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'mix'}.wav`);
        } catch (err) {
            console.error(err);
            const motivo = err instanceof Error ? err.message : '';
            setSaveErro(motivo ? `Não foi possível gerar o mix: ${motivo}.` : "Não foi possível gerar o mix. Tente novamente.");
        } finally {
            setExporting(false);
        }
    }, [projeto]);

    const handleSaveLayer = useCallback(async (layerId: string, changes: { volume_padrao: number; delay_offset: number }) => {
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
                setSaveErro(null);
            } else {
                setSaveErro('Erro ao salvar alterações');
            }
        } catch (err) {
            console.error('Erro ao salvar:', err);
            setSaveErro('Erro ao salvar alterações');
        } finally {
            setSaving(null);
        }
    }, []);

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
                setSaveErro(null);
            } else {
                setSaveErro(data.mensagem || 'Erro ao atualizar status da camada');
            }
        } catch (err) {
            console.error('Erro ao autorizar camada:', err);
            setSaveErro('Erro ao conectar ao servidor');
        }
    }, []);

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

    if (loading) return <div className="loading-txt">Montando setup do estúdio...</div>;
    if (erro) return <div className="error-msg">{erro}</div>;
    if (!projeto) return <div className="error-msg">Projeto não encontrado.</div>;

    return (
        <div className="studio-page">
            <SEOHead
                title={`Estúdio: ${projeto.titulo}`}
                description={`Estúdio do projeto "${projeto.titulo}" - BPM: ${projeto.bpm}, Gênero: ${projeto.genero}. Colabore em tempo real.`}
                url={`/studio/${id}`}
            />
            <div className="user-header">
                <h1>Estúdio: {projeto.titulo}</h1>
                <p>BPM: <strong>{projeto.bpm}</strong> | Gênero: {projeto.genero}</p>
                <div className="studio-meta">
                    <span className={`status-projeto status-${(projeto.status ?? 'IDEIA').toLowerCase()}`}>{rotuloStatus(projeto.status)}</span>
                    {meuPapel && <span className={`papel-badge papel-${meuPapel.toLowerCase()}`}>Você: {rotuloPapel(meuPapel)}</span>}
                </div>
                {isOwner && (
                    <div className="project-owner-actions">
                        <button
                            className="btn-edit-project"
                            onClick={() => setEditModalOpen(true)}
                        >
                            <Pencil size={16} />
                            Editar
                        </button>
                        <button
                            className="btn-delete-project"
                            onClick={() => setDeleteModalOpen(true)}
                        >
                            <Trash2 size={16} />
                            Excluir
                        </button>
                    </div>
                )}
                <div className="studio-controls">
                    <button className="btn-small" onClick={handleExport} disabled={exporting}>
                        <Download size={18} /> {exporting ? 'Gerando...' : 'Exportar WAV'}
                    </button>
                    {podeEnviar && (
                        <button className="btn-small btn-gravar" onClick={() => setCreateLayerModalOpen(true)}>
                            <Mic size={18} /> Gravar
                        </button>
                    )}
                </div>
            </div>

            <div className="studio-tabs">
                <button
                    className={`tab-btn ${activeTab === 'tracks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tracks')}
                >
                    <Music size={18} />
                    Tracks
                </button>
                <button
                    className={`tab-btn ${activeTab === 'mural' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mural')}
                >
                    <MessageSquare size={18} />
                    Mural
                </button>
                <button
                    className={`tab-btn ${activeTab === 'sugestoes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sugestoes')}
                >
                    <Lightbulb size={18} />
                    Sugestões
                </button>
                <button
                    className={`tab-btn ${activeTab === 'colaboradores' ? 'active' : ''}`}
                    onClick={() => setActiveTab('colaboradores')}
                >
                    <Users size={18} />
                    Colaboradores
                </button>
            </div>

            <main className="studio-content">
                {saveErro && <div className="error-msg">{saveErro}</div>}
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

            <CreateLayerModal
                projetoId={id || ''}
                isOpen={createLayerModalOpen}
                onClose={() => setCreateLayerModalOpen(false)}
                onLayerCreated={refetchProjeto}
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
