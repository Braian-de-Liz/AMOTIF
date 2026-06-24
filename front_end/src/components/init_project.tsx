import { useState, useRef } from 'react';
import { parseBlob } from 'music-metadata';
import { URL_API_TESTE, UPLOAD_URL } from '../utility/url_apis';
import { projectSchema, generos } from '../schemas/projectSchema';
import { formatZodErrors } from '../utility/validationHelpers';
import { Modal } from './Modal';
import type { AudioMeta } from '../types';
import '../styles/User.css';

const DURACAO_MAXIMA_SEGUNDOS = 300;

interface CreateProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onProjectCreated: () => void
}

function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        titulo: '',
        genero: 'LO_FI',
        bpm: 120,
        escala: '',
        descricao: ''
    });

    const [loading, setLoading] = useState(false);
    const [audioMeta, setAudioMeta] = useState<AudioMeta | null>(null);
    const [audioAnalyzing, setAudioAnalyzing] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    async function handleFileChange(arquivo: File | undefined) {
        if (!arquivo) return;

        setAudioAnalyzing(true);
        setAudioError(null);
        setAudioMeta(null);
        setFile(arquivo);

        try {
            const metadata = await parseBlob(arquivo);
            const duracao = metadata.format.duration ?? 0;

            if (duracao > DURACAO_MAXIMA_SEGUNDOS) {
                setAudioError(`Áudio muito longo! Máximo de ${DURACAO_MAXIMA_SEGUNDOS / 60} minutos. Este áudio tem ${duracao.toFixed(1)}s.`);
                setFile(null);
                return;
            }

            if (!metadata.format.codec) {
                setAudioError("Formato de áudio não reconhecido ou arquivo corrompido.");
                setFile(null);
                return;
            }

            const bpmExtraido = metadata.common.bpm;
            if (bpmExtraido && bpmExtraido > 0) {
                setFormData(prev => ({ ...prev, bpm: Math.round(bpmExtraido) }));
            }

            const meta: AudioMeta = {
                nome: arquivo.name,
                tamanhoMB: +(arquivo.size / 1024 / 1024).toFixed(2),
                duracaoSegundos: +duracao.toFixed(2),
                codec: metadata.format.codec,
                sampleRate: metadata.format.sampleRate || 0
            };

            setAudioMeta(meta);
        } catch {
            setAudioError("Não foi possível ler os metadados do arquivo.");
            setFile(null);
        } finally {
            setAudioAnalyzing(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        if (!file) { setSubmitError("Por favor, selecione um áudio guia."); return; }
        if (!audioMeta) { setSubmitError("Aguardando análise do áudio..."); return; }

        const validate = projectSchema.safeParse({
            ...formData,
            bpm: Number(formData.bpm),
        });
        if (!validate.success) {
            setSubmitError(formatZodErrors(validate.error));
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("token");

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
                headers: { 'Authorization': `Bearer ${token}` },
                body: uploadData,
            });

            if (!uploadResponse.ok) {
                const errBody = await uploadResponse.json().catch(() => ({}));
                throw new Error(errBody.error || "Falha ao enviar áudio.");
            }

            const uploadResult = await uploadResponse.json();
            const urlFinalAudio: string = uploadResult.path;

            const response = await fetch(`${URL_API_TESTE}/projetos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    titulo: formData.titulo,
                    genero: formData.genero,
                    bpm: Number(formData.bpm),
                    escala: formData.escala || undefined,
                    descricao: formData.descricao || undefined,
                    audio_guia: urlFinalAudio,
                    audio_metadata: audioMeta
                })
            });

            if (response.ok) {
                onProjectCreated();
                onClose();
            } else {
                const data = await response.json();
                setSubmitError(data.mensagem || "Erro ao criar projeto.");
            }
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Novo Projeto" titleId="modal-title">
            {submitError && <div className="error-badge">{submitError}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="proj-titulo">Título do Projeto</label>
                    <input
                        id="proj-titulo"
                        type="text"
                        required
                        placeholder="Ex: Melodia de Outono"
                        value={formData.titulo}
                        onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="proj-genero">Gênero Musical</label>
                    <select
                        id="proj-genero"
                        className="custom-select"
                        value={formData.genero}
                        onChange={e => setFormData({ ...formData, genero: e.target.value })}
                    >
                        {generos.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="proj-escala">Escala (Opcional)</label>
                    <input
                        id="proj-escala"
                        type="text"
                        placeholder="Ex: Am, C# Major"
                        value={formData.escala}
                        onChange={e => setFormData({ ...formData, escala: e.target.value })}
                    />
                </div>

                <div className="upload-group">
                    <label>Áudio Guia (MP3/WAV)</label>
                    <label className="file-drop-area">
                        <span className="upload-icon">🎵</span>
                        <span className="file-msg">
                            {audioAnalyzing ? "Analisando áudio..." :
                             audioError ? "Clique para tentar novamente" :
                             audioMeta ? "Áudio validado!" :
                             "Clique para selecionar o áudio"}
                        </span>
                        {audioAnalyzing && <span className="analyzing-badge">Analisando...</span>}
                        {audioError && <span className="error-badge">{audioError}</span>}
                        {audioMeta && (
                            <span className="meta-badge">
                                {audioMeta.nome} — {audioMeta.duracaoSegundos}s · {audioMeta.codec} · {audioMeta.sampleRate}Hz
                            </span>
                        )}
                        <input
                            type="file"
                            accept="audio/*"
                            required
                            className="modal-file-input"
                            onChange={e => handleFileChange(e.target.files?.[0])}
                        />
                    </label>
                </div>

                <div className="form-group">
                    <label htmlFor="proj-descricao">Descrição</label>
                    <textarea
                        id="proj-descricao"
                        className="modal-textarea"
                        value={formData.descricao}
                        rows={2}
                        placeholder="Conte mais sobre a vibe do projeto..."
                        onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                    />
                </div>

                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="btn-cancel">
                        Cancelar
                    </button>
                    <button type="submit" className="btn-confirm" disabled={loading || audioAnalyzing || !!audioError}>
                        {loading ? 'Publicando...' :
                         audioAnalyzing ? 'Analisando...' :
                         'Publicar Projeto'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export { CreateProjectModal };
