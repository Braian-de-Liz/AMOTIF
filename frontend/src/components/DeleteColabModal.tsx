import { useState } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';
import { Modal } from './Modal';

interface DeleteColabModalProps {
    projetoId: string
    userId: string
    userName: string
    isOpen: boolean
    onClose: () => void
    onRemoved: () => void
}

function DeleteColabModal({ projetoId, userId, userName, isOpen, onClose, onRemoved }: DeleteColabModalProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleClose() {
        setError(null);
        onClose();
    }

    async function handleRemove() {
        setError(null);
        setSaving(true);
        try {
            const res = await fetch(`${URL_API_TESTE}/colaboration/${projetoId}/remove/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok) {
                onRemoved();
                handleClose();
            } else {
                setError(data.mensagem || "Erro ao remover colaborador.");
            }
        } catch {
            setError("Erro de conexão.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Remover Colaborador" titleId="delete-colab-title" variant="danger">
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--erro-bg)', borderRadius: '10px', border: '1px solid var(--erro)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Tem certeza que deseja remover <strong style={{ color: 'var(--erro)' }}>{userName}</strong> deste projeto? Ele perderá acesso ao estúdio.
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleClose} disabled={saving}>
                    Cancelar
                </button>
                <button type="button" className="btn-danger" onClick={handleRemove} disabled={saving}>
                    {saving ? 'Removendo...' : 'Remover'}
                </button>
            </div>
        </Modal>
    );
}

export { DeleteColabModal };
