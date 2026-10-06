import { useState, useEffect } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';
import { History, RotateCcw, Loader2, X, Undo2, Play, GitBranch } from 'lucide-react';
import { BranchManager } from './BranchManager';

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

interface LayerVersionPanelProps {
    layerId: string
    isOpen: boolean
    onClose: () => void
    onRollback?: () => void
    onRestoreInPlace?: () => void
    onOpenDetail?: (version: Version) => void
}

function LayerVersionPanel({ layerId, isOpen, onClose, onRollback, onRestoreInPlace, onOpenDetail }: LayerVersionPanelProps) {
    const [versoes, setVersoes] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);
    const [rollbacking, setRollbacking] = useState<string | null>(null);
    const [restoringInPlace, setRestoringInPlace] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'versions' | 'branches'>('versions');
    const [branchManagerOpen, setBranchManagerOpen] = useState(false);

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
                console.error('Erro ao carregar vers\u00f5es:', err);
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

    const handleRestoreInPlace = async (versionId: string) => {
        setRestoringInPlace(versionId);
        try {
            const res = await fetch(`${URL_API_TESTE}/layer/${layerId}/restore/${versionId}`, {
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
            setRestoringInPlace(null);
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
                    <div className="version-panel-tabs">
                        <button
                            className={`version-tab ${activeTab === 'versions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('versions')}
                        >
                            <History size={16} /> Versões
                        </button>
                        <button
                            className={`version-tab ${activeTab === 'branches' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('branches'); setBranchManagerOpen(true); }}
                        >
                            <GitBranch size={16} /> Branches
                        </button>
                    </div>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="version-panel-content">
                    {activeTab === 'versions' ? (
                        <>
                            {loading ? (
                                <div className="version-loading">
                                    <Loader2 size={24} className="spin" />
                                    <span>Carregando...</span>
                                </div>
                            ) : versoes.length === 0 ? (
                                <p className="version-empty">Nenhuma vers\u00e3o encontrada.</p>
                            ) : (
                                <div className="version-list">
                                    {versoes.map((v) => (
                                        <div key={v.id} className="version-item" onClick={() => onOpenDetail?.(v)}>
                                            <div className="version-item-header">
                                                <span className="version-number">v{v.versionNumber}</span>
                                                {v.tag && <span className="version-tag">{v.tag}</span>}
                                                <span className="version-date">{formatDate(v.createdAt)}</span>
                                            </div>
                                            {v.mensagem && (
                                                <p className="version-message">{v.mensagem}</p>
                                            )}
                                            <audio
                                                src={v.audio_url}
                                                controls
                                                className="version-preview-audio"
                                                onClick={e => e.stopPropagation()}
                                            />
                                            <div className="version-item-footer">
                                                <span className="version-author">por {v.autor.nome_completo}</span>
                                                <div className="version-actions">
                                                    <button
                                                        className="btn-rollback"
                                                        onClick={(e) => { e.stopPropagation(); handleRollback(v.id); }}
                                                        disabled={rollbacking === v.id || restoringInPlace === v.id}
                                                        title="Restaurar criando nova vers\u00e3o"
                                                    >
                                                        {rollbacking === v.id ? (
                                                            <Loader2 size={14} className="spin" />
                                                        ) : (
                                                            <RotateCcw size={14} />
                                                        )}
                                                        Restaurar (nova vers\u00e3o)
                                                    </button>
                                                    <button
                                                        className="btn-restore-inplace"
                                                        onClick={(e) => { e.stopPropagation(); handleRestoreInPlace(v.id); }}
                                                        disabled={restoringInPlace === v.id || rollbacking === v.id}
                                                        title="Restaurar no lugar (sem criar nova vers\u00e3o)"
                                                    >
                                                        {restoringInPlace === v.id ? (
                                                            <Loader2 size={14} className="spin" />
                                                        ) : (
                                                            <Undo2 size={14} />
                                                        )}
                                                        Restaurar (in-place)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>

            <BranchManager
                layerId={layerId}
                isOpen={branchManagerOpen && activeTab === 'branches'}
                onClose={() => { setBranchManagerOpen(false); setActiveTab('versions'); }}
                onMerge={onRollback}
                currentVersionId={versoes[0]?.id}
            />
        </div>
    );
}

export { LayerVersionPanel };
