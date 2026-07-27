import { useState } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';
import { Modal } from './Modal';

interface DeleteLayerModalProps {
    layerId: string
    layerName: string
    isOpen: boolean
    onClose: () => void
    onDeleted: () => void
}

function DeleteLayerModal({ layerId, layerName, isOpen, onClose, onDeleted }: DeleteLayerModalProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleClose() {
        setError(null);
        onClose();
    }

    async function handleDelete() {
        setError(null);
        setSaving(true);
        try {
            const res = await fetch(`${URL_API_TESTE}/layer/${layerId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok) {
                onDeleted();
                handleClose();
            } else {
                setError(data.mensagem || "Erro ao excluir camada.");
            }
        } catch {
            setError("Erro de conexão.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Excluir Camada" titleId="delete-layer-title" variant="danger">
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--erro-bg)', borderRadius: '10px', border: '1px solid var(--erro)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Tem certeza que deseja excluir a camada <strong style={{ color: 'var(--erro)' }}>"{layerName}"</strong>? Esta ação é <strong style={{ color: 'var(--erro)' }}>irreversível</strong>.
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleClose} disabled={saving}>
                    Cancelar
                </button>
                <button type="button" className="btn-danger" onClick={handleDelete} disabled={saving}>
                    {saving ? 'Excluindo...' : 'Excluir Camada'}
                </button>
            </div>
        </Modal>
    );
}

export { DeleteLayerModal };
