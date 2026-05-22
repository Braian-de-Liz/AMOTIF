import { useState, useEffect, useRef } from 'react';
import { parseBlob } from 'music-metadata';
import { URL_API_TESTE, UPLOAD_URL } from '../utility/url_apis';
import '../styles/User.css';

const DURACAO_MAXIMA_SEGUNDOS = 300;
const generos = ["ROCK", "POP", "JAZZ", "BLUES", "FORRO", "METAL", "HIP_HOP", "ELECTRONIC", "CLASSICAL", "LO_FI", "INDIE", "SERTANEJO", "SAMBA", "MPB", "COUNTRY", "FUNK", "SOUNDTRACK", "REGGAE"];

function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        titulo: '',
        genero: 'LO_FI',
        bpm: 120,
        escala: '',
        descricao: ''
    });

    const [loading, setLoading] = useState(false);
    const [audioMeta, setAudioMeta] = useState(null);
    const [audioAnalyzing, setAudioAnalyzing] = useState(false);
    const [audioError, setAudioError] = useState(null);
    const [submitError, setSubmitError] = useState(null);
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    async function handleFileChange(arquivo) {
        if (!arquivo) return;

        setAudioAnalyzing(true);
        setAudioError(null);
        setAudioMeta(null);
        setFile(arquivo);

        try {
            const metadata = await parseBlob(arquivo);
            const duracao = metadata.format.duration;

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

            const meta = {
                nome: arquivo.name,
                tamanhoMB: +(arquivo.size / 1024 / 1024).toFixed(2),
                duracaoSegundos: +duracao.toFixed(2),
                codec: metadata.format.codec,
                sampleRate: metadata.format.sampleRate || 0
            };

            setAudioMeta(meta);
        } catch (err) {
            console.error("Erro ao analisar áudio:", err);
            setAudioError("Não foi possível ler os metadados do arquivo. O arquivo pode estar corrompido ou em um formato não suportado.");
            setFile(null);
        } finally {
            setAudioAnalyzing(false);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);
        if (!file) { setSubmitError("Por favor, selecione um áudio guia."); return; }
        if (!audioMeta) { setSubmitError("Aguardando análise do áudio..."); return; }

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
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: uploadData,
            });

            if (!uploadResponse.ok) {
                const errBody = await uploadResponse.json().catch(() => ({}));
                throw new Error(errBody.error || "Falha ao enviar áudio para o servidor de storage.");
            }

            const uploadResult = await uploadResponse.json();
            const url_final_audio = uploadResult.path;

            const projectBody = {
                titulo: formData.titulo,
                genero: formData.genero,
                bpm: Number(formData.bpm),
                escala: formData.escala || undefined,
                descricao: formData.descricao || undefined,
                audio_guia: url_final_audio,
                audio_metadata: audioMeta
            };

            const response = await fetch(`${URL_API_TESTE}/projetos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(projectBody)
            });

            if (response.ok) {
                onProjectCreated();
                onClose();
            } else {
                const data = await response.json();
                setSubmitError(`Erro: ${data.mensagem}`);
            }
        } catch (error) {
            console.error(error);
            setSubmitError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <div className="modal-content form_login" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={modalRef}>
                <h2 className="modal-title" id="modal-title">Novo Projeto</h2>

                {submitError && <div className="error-badge">{submitError}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Título do Projeto</label>
                        <input
                            type="text" required placeholder="Ex: Melodia de Outono"
                            value={formData.titulo}
                            onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Gênero Musical</label>
                        <select className="custom-select" value={formData.genero}
                            onChange={e => setFormData({ ...formData, genero: e.target.value })}
                        >
                            {generos.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Escala (Opcional)</label>
                        <input
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
                                type="file" accept="audio/*" required
                                className="modal-file-input"
                                onChange={e => handleFileChange(e.target.files[0])}
                            />
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Descrição</label>
                        <textarea className="modal-textarea" value={formData.descricao} rows="2"
                            placeholder="Conte mais sobre a vibe do projeto..."
                            onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-small btn-modal-cancel">
                            Cancelar
                        </button>
                        <button type="submit" id="btn_envia" className="btn-modal-submit" disabled={loading || audioAnalyzing || !!audioError}>
                            {loading ? 'Publicando...' :
                             audioAnalyzing ? 'Analisando...' :
                             'Publicar Projeto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export { CreateProjectModal };