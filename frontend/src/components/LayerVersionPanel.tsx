import { useState, useEffect } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';
import { History, RotateCcw, Loader2, X } from 'lucide-react';

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
    createdAt: string
    autor: VersionAutor
}

interface LayerVersionPanelProps {
    layerId: string
    isOpen: boolean
    onClose: () => void
    onRollback?: () => void
}

function LayerVersionPanel({ layerId, isOpen, onClose, onRollback }: LayerVersionPanelProps) {
    const [versoes, setVersoes] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);
    const [rollbacking, setRollbacking] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !layerId) return;

        async function carregarVersoes() {
            setLoading(true);
            try {
                const res = await fetch(`${URL_API_TESTE}/layer/${layerId}/versions`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setVersoes(data.versoes || []);
                }
            } catch (err) {
                console.error('Erro ao carregar versões:', err);
            } finally {
                setLoading(false);
            }
        }

        carregarVersoes();
    }, [isOpen, layerId]);

    const handleRollback = async (versionId: string) => {
        setRollbacking(versionId);
        try {
            const res = await fetch(`${URL_API_TESTE}/layer/${layerId}/rollback/${versionId}`, {
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
            setRollbacking(null);
        }
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

    if (!isOpen) return null;

    return (
        <div className="version-panel-overlay" onClick={onClose}>
            <div className="version-panel" onClick={e => e.stopPropagation()}>
                <div className="version-panel-header">
                    <h3><History size={18} /> Histórico de Versões</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="version-panel-content">
                    {loading ? (
                        <div className="version-loading">
                            <Loader2 size={24} className="spin" />
                            <span>Carregando...</span>
                        </div>
                    ) : versoes.length === 0 ? (
                        <p className="version-empty">Nenhuma versão encontrada.</p>
                    ) : (
                        <div className="version-list">
                            {versoes.map((v) => (
                                <div key={v.id} className="version-item">
                                    <div className="version-item-header">
                                        <span className="version-number">v{v.versionNumber}</span>
                                        <span className="version-date">{formatDate(v.createdAt)}</span>
                                    </div>
                                    {v.mensagem && (
                                        <p className="version-message">{v.mensagem}</p>
                                    )}
                                    <div className="version-item-footer">
                                        <span className="version-author">por {v.autor.nome_completo}</span>
                                        <button
                                            className="btn-rollback"
                                            onClick={() => handleRollback(v.id)}
                                            disabled={rollbacking === v.id}
                                            title="Restaurar esta versão"
                                        >
                                            {rollbacking === v.id ? (
                                                <Loader2 size={14} className="spin" />
                                            ) : (
                                                <RotateCcw size={14} />
                                            )}
                                            Restaurar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export { LayerVersionPanel };
