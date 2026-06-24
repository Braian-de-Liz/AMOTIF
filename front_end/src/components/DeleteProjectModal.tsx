import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { URL_API_TESTE } from '../utility/url_apis';
import { Modal } from './Modal';

interface DeleteProjectModalProps {
    projetoId: string
    isOpen: boolean
    onClose: () => void
}

function DeleteProjectModal({ projetoId, isOpen, onClose }: DeleteProjectModalProps) {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [senha, setSenha] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleClose() {
        setSenha('');
        setError(null);
        onClose();
    }

    async function handleDelete(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!token) return;

        setSaving(true);
        try {
            const res = await fetch(`${URL_API_TESTE}/projetos/${projetoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ senha })
            });
            const data = await res.json();

            if (res.ok) {
                navigate('/usuario');
            } else {
                setError(data.mensagem || "Erro ao excluir projeto.");
            }
        } catch {
            setError("Erro de conexão.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Excluir Projeto" titleId="delete-project-title" variant="danger">
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--erro-bg)', borderRadius: '10px', border: '1px solid var(--erro)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Tem certeza que deseja excluir este projeto? Todas as <strong style={{ color: 'var(--erro)' }}>camadas serão perdidas</strong>. Esta ação é <strong style={{ color: 'var(--erro)' }}>irreversível</strong>.
            </div>

            {error && <div className="form-error">{error}</div>}

            <form onSubmit={handleDelete}>
                <div className="form-group">
                    <label htmlFor="senha-projeto">Digite sua senha para confirmar</label>
                    <input
                        id="senha-projeto"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Sua senha atual"
                        required
                        autoFocus
                    />
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={handleClose} disabled={saving}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-danger" disabled={saving || !senha}>
                        {saving ? 'Excluindo...' : 'Excluir Projeto'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export { DeleteProjectModal };
