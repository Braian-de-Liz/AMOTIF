// front_end/src/pages/studio.jsx
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { WaveformTrack } from "../components/WaveformTrack";
import { StudioMural } from "../components/StudioMural";
import { StudioColaboradores } from "../components/StudioColaboradores";
import { URL_API_TESTE } from "../utility/url_apis";
import { Play, Pause, Mic, Music, Users, MessageSquare } from "lucide-react";
import '../styles/Studio.css';

function Studio() { 
    const { id } = useParams();
    const [projeto, setProjeto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [isPlayingAll, setIsPlayingAll] = useState(false);
    const [saving, setSaving] = useState(null);
    const [activeTab, setActiveTab] = useState('tracks');

    const wavesurferRefs = useRef({});

    useEffect(() => {
        async function carregarProjeto() {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${URL_API_TESTE}/projetos/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
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

    const registerWavesurfer = (layerId, ws) => {
        wavesurferRefs.current[layerId] = ws;
    };

    const playAll = async () => {
        if (!projeto) return;
        
        const allWavesurfers = wavesurferRefs.current;
        
        const guideWs = allWavesurfers['__guide__'];
        const layerWses = projeto.camadas?.map(c => allWavesurfers[c.id]).filter(Boolean) || [];

        if (isPlayingAll) {
            guideWs?.pause();
            layerWses.forEach(ws => ws?.pause());
            setIsPlayingAll(false);
        } else {
            if (guideWs) {
                guideWs.play();
            }
            layerWses.forEach(ws => ws?.play());
            setIsPlayingAll(true);
        }
    };

    const handleStopAll = () => {
        const allWavesurfers = wavesurferRefs.current;
        
        const guideWs = allWavesurfers['__guide__'];
        const layerWses = projeto.camadas?.map(c => allWavesurfers[c.id]).filter(Boolean) || [];

        guideWs?.pause();
        guideWs?.seekTo(0);
        layerWses.forEach(ws => {
            ws?.pause();
            ws?.seekTo(0);
        });
        
        setIsPlayingAll(false);
    };

    const handleSaveLayer = async (layerId, changes) => {
        setSaving(layerId);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${URL_API_TESTE}/layer/${layerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(changes)
            });

            if (response.ok) {
                setProjeto(prev => ({
                    ...prev,
                    camadas: prev.camadas.map(c => 
                        c.id === layerId ? { ...c, ...changes } : c
                    )
                }));
            } else {
                alert('Erro ao salvar alterações');
            }
        } catch (err) {
            console.error('Erro ao salvar:', err);
            alert('Erro ao salvar alterações');
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="loading-txt">Montando setup do estúdio...</div>;
    if (erro) return <div className="error-msg">{erro}</div>;
    if (!projeto) return <div className="error-msg">Projeto não encontrado.</div>;

    const isOwner = projeto.autor?.id === localStorage.getItem("usuario_id");

    return (
        <div className="studio-page"> 
            <div className="user-header">
                <h1>Estúdio: {projeto.titulo}</h1>
                <p>BPM: <strong>{projeto.bpm}</strong> | Gênero: {projeto.genero}</p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                        className="btn-create-proj"
                        onClick={playAll}
                    >
                        {isPlayingAll ? <Pause size={18}/> : <Play size={18}/>} 
                        {isPlayingAll ? ' Pausar Tudo' : ' Ouvir Tudo'}
                    </button>
                    {isPlayingAll && (
                        <button 
                            className="btn-small" 
                            onClick={handleStopAll}
                            style={{borderColor: '#ef4444', color: '#ef4444'}}
                        >
                            Stop
                        </button>
                    )}
                    <button className="btn-small" style={{borderColor: 'var(--verde-medio)'}}>
                        <Mic size={18}/> Gravar
                    </button>
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
                    className={`tab-btn ${activeTab === 'colaboradores' ? 'active' : ''}`}
                    onClick={() => setActiveTab('colaboradores')}
                >
                    <Users size={18} />
                    Colaboradores
                </button>
            </div>

            <main className="studio-content">
                {activeTab === 'tracks' && (
                    <div className="studio-tracks">
                        <WaveformTrack
                            audioUrl={projeto.audio_guia}
                            nome="Áudio Guia"
                            autor={projeto.autor?.nome_completo}
                            layerId="__guide__"
                            delayOffset={0}
                            volume={1.0}
                            colorIndex={0}
                            isGuia={true}
                            onRegister={registerWavesurfer}
                        />

                        {projeto.camadas?.map((camada, index) => (
                            <WaveformTrack
                                key={camada.id}
                                audioUrl={camada.audio_url}
                                nome={camada.instrumento_tag}
                                autor={camada.autor?.nome_completo}
                                layerId={camada.id}
                                delayOffset={camada.delay_offset}
                                volume={camada.volume_padrao}
                                colorIndex={index + 1}
                                isGuia={false}
                                saving={saving === camada.id}
                                onSave={handleSaveLayer}
                                onRegister={registerWavesurfer}
                            />
                        ))}
                    </div>
                )}

                {activeTab === 'mural' && (
                    <StudioMural projetoId={id} isOwner={isOwner} />
                )}

                {activeTab === 'colaboradores' && (
                    <StudioColaboradores projetoId={id} isOwner={isOwner} />
                )}
            </main>
            </div>
    );
}

export {Studio};