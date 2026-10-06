import { useState, useEffect, useRef } from 'react';
import { GitBranch, Plus, ChevronDown, Loader2 } from 'lucide-react';
import { fetchBranches, switchBranch, createBranch, deleteBranch } from '../utility/branchApi';
import type { LayerBranch } from '../types/project';

interface BranchSelectorProps {
    layerId: string
    currentVersionId?: string
    onSwitch?: () => void
    disabled?: boolean
}

function BranchSelector({ layerId, currentVersionId, onSwitch, disabled }: BranchSelectorProps) {
    const [branches, setBranches] = useState<LayerBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [baseVersionId, setBaseVersionId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadBranches();
    }, [layerId]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadBranches = async () => {
        setLoading(true);
        try {
            const data = await fetchBranches(layerId);
            setBranches(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar branches');
        } finally {
            setLoading(false);
        }
    };

    const handleSwitch = async (branch: LayerBranch) => {
        if (disabled) return;
        try {
            await switchBranch(layerId, branch.id);
            onSwitch?.();
            setOpen(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erro ao trocar branch');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBranchName.trim() || !baseVersionId) return;

        setCreating(true);
        setError(null);
        try {
            await createBranch(layerId, newBranchName.trim(), baseVersionId);
            setNewBranchName('');
            setBaseVersionId('');
            setOpen(false);
            await loadBranches();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar branch');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (branch: LayerBranch, e: React.MouseEvent) => {
        e.stopPropagation();
        if (branch.isMain) return;
        if (!confirm(`Excluir branch "${branch.nome}"?`)) return;

        try {
            await deleteBranch(layerId, branch.id);
            await loadBranches();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erro ao excluir branch');
        }
    };

    const currentBranch = branches.find(b => b.headVersion.id === currentVersionId) || branches.find(b => b.isMain);
    const mainBranch = branches.find(b => b.isMain);

    if (loading) {
        return (
            <div className="branch-selector-loading">
                <Loader2 size={16} className="spin" />
            </div>
        );
    }

    return (
        <div className="branch-selector" ref={dropdownRef}>
            <button
                className="branch-selector-trigger"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                title={disabled ? 'Apenas o autor da camada ou dono do projeto pode gerenciar branches' : 'Gerenciar branches'}
            >
                <GitBranch size={16} />
                <span>{currentBranch?.nome || mainBranch?.nome || 'main'}</span>
                <ChevronDown size={14} />
            </button>

            {open && (
                <div className="branch-dropdown">
                    <div className="branch-dropdown-header">
                        <strong>Branches</strong>
                        <button className="btn-create-branch" onClick={(e) => { e.stopPropagation(); }}>
                            <Plus size={14} /> Nova
                        </button>
                    </div>

                    {creating && (
                        <form onSubmit={handleCreate} className="branch-create-form">
                            <input
                                type="text"
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                                placeholder="Nome da branch (ex: experiment-arranjo)"
                                maxLength={50}
                                autoFocus
                                className="branch-name-input"
                            />
                            <select
                                value={baseVersionId}
                                onChange={(e) => setBaseVersionId(e.target.value)}
                                className="branch-base-select"
                                required
                            >
                                <option value="">Basear em versão...</option>
                                {branches.flatMap(b => [
                                    { id: b.headVersion.id, label: `${b.nome} (v${b.headVersion.versionNumber})` },
                                    { id: b.baseVersion.id, label: `${b.nome} base (v${b.baseVersion.versionNumber})` }
                                ]).filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i).map(v => (
                                    <option key={v.id} value={v.id}>{v.label}</option>
                                ))}
                            </select>
                            <div className="branch-create-actions">
                                <button type="button" className="btn-cancel" onClick={() => { setCreating(false); setNewBranchName(''); setBaseVersionId(''); }}>Cancelar</button>
                                <button type="submit" className="btn-confirm" disabled={creating || !newBranchName.trim() || !baseVersionId}>
                                    {creating ? <Loader2 size={14} className="spin" /> : 'Criar'}
                                </button>
                            </div>
                        </form>
                    )}

                    <ul className="branch-list">
                        {branches.map(branch => (
                            <li key={branch.id} className={`branch-item ${branch.id === currentBranch?.id ? 'active' : ''} ${branch.isMain ? 'main' : ''}`}>
                                <div className="branch-info">
                                    <span className={`branch-name ${branch.isMain ? 'main-badge' : ''}`}>
                                        {branch.isMain && <span className="main-label">main</span>}
                                        {branch.nome}
                                    </span>
                                    <span className="branch-versions">
                                        head: v{branch.headVersion.versionNumber} • base: v{branch.baseVersion.versionNumber}
                                    </span>
                                </div>
                                <div className="branch-actions">
                                    {!branch.isMain && (
                                        <button
                                            className="btn-delete-branch"
                                            onClick={(e) => handleDelete(branch, e)}
                                            title="Excluir branch"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                {!branch.isMain && branch.headVersion.id !== currentVersionId && (
                                    <button
                                        className="btn-switch-branch"
                                        onClick={() => handleSwitch(branch)}
                                        disabled={disabled}
                                    >
                                        Trocar para esta
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>

                    {error && <div className="branch-error">{error}</div>}
                </div>
            )}
        </div>
    );
}

export { BranchSelector };