import { useState, useEffect } from 'react';
import { GitBranch, GitMerge, Loader2, X, ArrowRight } from 'lucide-react';
import { fetchBranches, mergeBranch, deleteBranch } from '../utility/branchApi';
import type { LayerBranch } from '../types/project';

interface BranchManagerProps {
    layerId: string
    isOpen: boolean
    onClose: () => void
    onMerge?: () => void
    currentVersionId?: string
}

function BranchManager({ layerId, isOpen, onClose, onMerge, currentVersionId }: BranchManagerProps) {
    const [branches, setBranches] = useState<LayerBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [merging, setMerging] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !layerId) return;

        async function loadBranches() {
            setLoading(true);
            try {
                const data = await fetchBranches(layerId);
                setBranches(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar branches');
            } finally {
                setLoading(false);
            }
        }

        loadBranches();
    }, [isOpen, layerId]);

    const handleMerge = async (branch: LayerBranch) => {
        if (!confirm(`Fazer merge de "${branch.nome}" para main? Isso criará uma nova versão na branch principal.`)) return;

        setMerging(branch.id);
        setError(null);
        try {
            await mergeBranch(layerId, branch.id, `Merge de '${branch.nome}'`);
            onMerge?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer merge');
        } finally {
            setMerging(null);
        }
    };

    const handleDelete = async (branch: LayerBranch) => {
        if (branch.isMain) return;
        if (!confirm(`Excluir branch "${branch.nome}"?`)) return;

        setDeleting(branch.id);
        try {
            await deleteBranch(layerId, branch.id);
            setBranches(prev => prev.filter(b => b.id !== branch.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao excluir branch');
        } finally {
            setDeleting(null);
        }
    };

    const currentBranch = branches.find(b => b.headVersion.id === currentVersionId) || branches.find(b => b.isMain);

    if (!isOpen) return null;

    return (
        <div className="branch-manager-overlay" onClick={onClose}>
            <div className="branch-manager" onClick={e => e.stopPropagation()}>
                <div className="branch-manager-header">
                    <h3><GitBranch size={18} /> Gerenciar Branches</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="branch-manager-content">
                    {loading ? (
                        <div className="branch-loading">
                            <Loader2 size={24} className="spin" />
                            <span>Carregando...</span>
                        </div>
                    ) : branches.length === 0 ? (
                        <p className="branch-empty">Nenhuma branch encontrada.</p>
                    ) : (
                        <div className="branch-list">
                            {branches.map((branch) => (
                                <div key={branch.id} className={`branch-manager-item ${branch.id === currentBranch?.id ? 'active' : ''} ${branch.isMain ? 'main' : ''}`}>
                                    <div className="branch-manager-header-row">
                                        <div className="branch-manager-name">
                                            {branch.isMain && (
                                                <span className="main-badge">main</span>
                                            )}
                                            <span className={branch.id === currentBranch?.id ? 'current' : ''}>{branch.nome}</span>
                                            {branch.id === currentBranch?.id && <span className="current-badge">atual</span>}
                                        </div>
                                    </div>

                                    <div className="branch-manager-meta">
                                        <div className="branch-version-info">
                                            <span><strong>Head:</strong> v{branch.headVersion.versionNumber}</span>
                                            <ArrowRight size={14} />
                                            <span><strong>Base:</strong> v{branch.baseVersion.versionNumber}</span>
                                        </div>
                                        <div className="branch-author">por {branch.createdBy.nome_completo}</div>
                                    </div>

                                    {!branch.isMain && (
                                        <div className="branch-manager-actions">
                                            <button
                                                className={`btn-merge ${merging === branch.id ? 'loading' : ''}`}
                                                onClick={() => handleMerge(branch)}
                                                disabled={merging === branch.id}
                                            >
                                                {merging === branch.id ? (
                                                    <Loader2 size={14} className="spin" />
                                                ) : (
                                                    <>
                                                        <GitMerge size={14} />
                                                        Merge para main
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(branch)}
                                                disabled={deleting === branch.id}
                                            >
                                                {deleting === branch.id ? <Loader2 size={14} className="spin" /> : 'Excluir'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <div className="branch-error">{error}</div>}
                </div>
            </div>
        </div>
    );
}

export { BranchManager };