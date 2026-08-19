import { useState, useCallback } from 'react';
import { AudioEditor } from './AudioEditor';
import { Modal } from './Modal';
import { URL_API_TESTE } from '../utility/url_apis';
import { Loader2, Check } from 'lucide-react';

interface LayerEditorModalProps {
    layerId: string
    audioUrl: string
    nomeTrilha: string
    isOpen: boolean
    onClose: () => void
    onVersionCreated: () => void
}

function LayerEditorModal({ layerId, audioUrl, nomeTrilha, isOpen, onClose, onVersionCreated }: LayerEditorModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editedBlob, setEditedBlob] = useState<Blob | null>(null);

    function handleClose() {
        setEditedBlob(null);
        setError(null);
        onClose();
    }

    const handleEdited = useCallback((blob: Blob) => {
        setEditedBlob(blob);
    }, []);

    const handleSaveVersion = async () => {
        if (!editedBlob) return;

        setLoading(true);
        setError(null);

        try {
            const ext = editedBlob.type.includes('wav') ? '.wav' : '.webm';
            const fileName = `camada_${Date.now()}${ext}`;
            const file = new File([editedBlob], fileName, { type: editedBlob.type });

            const uploadData = new FormData();
            uploadData.append('audio', file);

            const uploadRes = await fetch(`${URL_API_TESTE}/upload`, {
                method: 'POST',
                credentials: 'include',
                body: uploadData,
            });

            if (!uploadRes.ok) {
                const errBody = await uploadRes.json().catch(() => ({}));
                throw new Error(errBody.mensagem || 'Falha ao enviar áudio editado.');
            }

            const { fileUrl } = await uploadRes.json();

            const response = await fetch(`${URL_API_TESTE}/layer/${layerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    audio_url: fileUrl,
                    nome_trilha: nomeTrilha,
                })
            });

            if (response.ok) {
                onVersionCreated();
                handleClose();
            } else {
                const data = await response.json();
                setError(data.mensagem || 'Erro ao salvar versão.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Editar: ${nomeTrilha}`} titleId="layer-editor-title">
            {error && <div className="form-error">{error}</div>}

            <AudioEditor
                audioUrl={audioUrl}
                audioDuration={0}
                onEdited={handleEdited}
            />

            <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn-cancel" onClick={handleClose} disabled={loading}>
                    Cancelar
                </button>
                <button
                    type="button"
                    className="btn-confirm"
                    onClick={handleSaveVersion}
                    disabled={loading || !editedBlob}
                >
                    {loading ? (
                        <><Loader2 size={16} className="spin" /> Salvando...</>
                    ) : (
                        <><Check size={16} /> Salvar Versão</>
                    )}
                </button>
            </div>
        </Modal>
    );
}

export { LayerEditorModal };
