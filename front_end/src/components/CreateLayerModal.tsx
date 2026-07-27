import { useState } from 'react';
import { parseBlob } from 'music-metadata';
import { URL_API_TESTE, UPLOAD_URL } from '../utility/url_apis';
import { createLayerSchema } from '../schemas/createLayerSchema';
import { formatZodErrors } from '../utility/validationHelpers';
import { Modal } from './Modal';

interface CreateLayerModalProps {
    projetoId: string
    isOpen: boolean
    onClose: () => void
    onLayerCreated: () => void
}

function CreateLayerModal({ projetoId, isOpen, onClose, onLayerCreated }: CreateLayerModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [nomeTrilha, setNomeTrilha] = useState('');
    const [instrumentoTag, setInstrumentoTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [audioAnalyzing, setAudioAnalyzing] = useState(false);
    const [audioMeta, setAudioMeta] = useState<{ nome: string; duracao: number } | null>(null);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    function handleClose() {
        setFile(null);
        setNomeTrilha('');
        setInstrumentoTag('');
        setAudioMeta(null);
        setAudioError(null);
        setSubmitError(null);
        onClose();
    }

    async function handleFileChange(arquivo: File | undefined) {
        if (!arquivo) return;

        setAudioAnalyzing(true);
        setAudioError(null);
        setAudioMeta(null);
        setFile(arquivo);

        try {
            const metadata = await parseBlob(arquivo);
            const duracao = metadata.format.duration ?? 0;

            if (!metadata.format.codec) {
                setAudioError("Formato de áudio não reconhecido ou arquivo corrompido.");
                setFile(null);
                return;
            }

            setAudioMeta({
                nome: arquivo.name,
                duracao: +duracao.toFixed(2)
            });
        } catch {
            setAudioError("Não foi possível ler os metadados do arquivo.");
            setFile(null);
        } finally {
            setAudioAnalyzing(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitError(null);

        const validate = createLayerSchema.safeParse({ nome_trilha: nomeTrilha, instrumento_tag: instrumentoTag });
        if (!validate.success) {
            setSubmitError(formatZodErrors(validate.error));
            return;
        }

        if (!file) {
            setSubmitError("Selecione um arquivo de áudio.");
            return;
        }

        setLoading(true);
        try {
            const sanitizedFileName = file.name
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '_');
            const sanitizedFile = new File([file], sanitizedFileName, { type: file.type });

            const uploadData = new FormData();
            uploadData.append('audio', sanitizedFile);

            const uploadResponse = await fetch(`${UPLOAD_URL}/upload`, {
                method: 'POST',
                credentials: 'include',
                body: uploadData,
            });

            if (!uploadResponse.ok) {
                const errBody = await uploadResponse.json().catch(() => ({}));
                throw new Error(errBody.error || "Falha ao enviar áudio.");
            }

            const uploadResult = await uploadResponse.json();
            const urlFinalAudio: string = uploadResult.path;

            const response = await fetch(`${URL_API_TESTE}/layer/${projetoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    nome_trilha: nomeTrilha,
                    audio_url: urlFinalAudio,
                    instrumento_tag: instrumentoTag,
                })
            });

            if (response.ok) {
                onLayerCreated();
                handleClose();
            } else {
                const data = await response.json();
                setSubmitError(data.mensagem || "Erro ao criar camada.");
            }
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Nova Camada" titleId="create-layer-title">
            {submitError && <div className="form-error">{submitError}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="layer-nome">Nome da Trilha</label>
                    <input
                        id="layer-nome"
                        type="text"
                        value={nomeTrilha}
                        onChange={e => setNomeTrilha(e.target.value)}
                        placeholder="Ex: Baixo Elétrico"
                        required
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="layer-instrumento">Instrumento</label>
                    <input
                        id="layer-instrumento"
                        type="text"
                        value={instrumentoTag}
                        onChange={e => setInstrumentoTag(e.target.value)}
                        placeholder="Ex: Baixo, Guitarra, Bateria..."
                        required
                    />
                </div>

                <div className="upload-group">
                    <label>Arquivo de Áudio</label>
                    <label className="file-drop-area">
                        <span className="upload-icon">🎵</span>
                        <span className="file-msg">
                            {audioAnalyzing ? "Analisando áudio..." :
                             audioError ? "Clique para tentar novamente" :
                             audioMeta ? `${audioMeta.nome} (${audioMeta.duracao}s)` :
                             "Clique para selecionar o áudio"}
                        </span>
                        {audioError && <span className="error-badge">{audioError}</span>}
                        <input
                            type="file"
                            accept="audio/*"
                            required
                            className="modal-file-input"
                            onChange={e => handleFileChange(e.target.files?.[0])}
                        />
                    </label>
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-confirm" disabled={loading || audioAnalyzing || !!audioError || !file}>
                        {loading ? 'Enviando...' : 'Enviar Camada'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export { CreateLayerModal };
