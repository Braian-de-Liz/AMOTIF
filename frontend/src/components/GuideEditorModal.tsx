import { useState, useCallback } from 'react';
import { AudioEditor } from './AudioEditor';
import { Modal } from './Modal';
import { URL_API_TESTE } from '../utility/url_apis';
import { uploadAudioFile } from '../utility/uploadAudio';
import { Loader2, Check } from 'lucide-react';

interface GuideEditorModalProps {
    projetoId: string
    audioUrl: string
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
}

function GuideEditorModal({ projetoId, audioUrl, isOpen, onClose, onSaved }: GuideEditorModalProps) {
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

    const handleSave = async () => {
        if (!editedBlob) return;

        setLoading(true);
        setError(null);

        try {
            const ext = editedBlob.type.includes('wav') ? '.wav' : '.webm';
            const file = new File([editedBlob], `guia_${Date.now()}${ext}`, { type: editedBlob.type });
            const fileUrl = await uploadAudioFile(file);

            const response = await fetch(`${URL_API_TESTE}/projetos/${projetoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ audio_guia: fileUrl }),
            });

            if (response.ok) {
                onSaved();
                handleClose();
            } else {
                const data = await response.json();
                setError(data.mensagem || 'Erro ao salvar o áudio guia.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Editar áudio guia" titleId="guide-editor-title">
            {error && <div className="form-error">{error}</div>}

            <AudioEditor audioUrl={audioUrl} onEdited={handleEdited} />

            <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn-cancel" onClick={handleClose} disabled={loading}>
                    Cancelar
                </button>
                <button
                    type="button"
                    className="btn-confirm"
                    onClick={handleSave}
                    disabled={loading || !editedBlob}
                >
                    {loading ? (
                        <><Loader2 size={16} className="spin" /> Salvando...</>
                    ) : (
                        <><Check size={16} /> Salvar áudio guia</>
                    )}
                </button>
            </div>
        </Modal>
    );
}

export { GuideEditorModal };
