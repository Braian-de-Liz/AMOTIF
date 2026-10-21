import { Mic, Upload } from 'lucide-react';
import { Modal } from './Modal';

interface AddLayerChoiceModalProps {
    isOpen: boolean
    onClose: () => void
    onRecord: () => void
    onCreateForm: () => void
}

function AddLayerChoiceModal({ isOpen, onClose, onRecord, onCreateForm }: AddLayerChoiceModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar camada" titleId="add-layer-choice-title">
            <div className="layer-choice-options">
                <button type="button" className="layer-choice-card" onClick={onRecord}>
                    <Mic size={24} />
                    <strong>Gravar no estúdio</strong>
                    <span>Grave, edite e envie a camada ouvindo o áudio guia.</span>
                </button>
                <button type="button" className="layer-choice-card" onClick={onCreateForm}>
                    <Upload size={24} />
                    <strong>Enviar um arquivo</strong>
                    <span>Preencha o formulário e envie um áudio que você já tem.</span>
                </button>
            </div>
            <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>
                    Cancelar
                </button>
            </div>
        </Modal>
    );
}

export { AddLayerChoiceModal };
