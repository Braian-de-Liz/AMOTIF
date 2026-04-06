import { useState } from 'react';
import { URL_API_TESTE, UPLOAD_URL } from '../utility/url_apis';
import '../styles/User.css';

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
    const generos = ["ROCK", "POP", "JAZZ", "BLUES", "FORRO", "METAL", "HIP_HOP", "ELECTRONIC", "CLASSICAL", "LO_FI", "INDIE", "SERTANEJO", "SAMBA", "MPB", "COUNTRY", "FUNK", "SOUNDTRACK", "REGGAE"];

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert("Por favor, selecione um áudio guia.");

        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            const uploadData = new FormData();
            uploadData.append('file', file);

            const uploadResponse = await fetch(UPLOAD_URL, {
                method: 'POST',
                body: uploadData,
            });

            if (!uploadResponse.ok) throw new Error("Falha ao subir áudio para o servidor de storage.");

            const uploadResult = await uploadResponse.json();
            const url_final_audio = uploadResult.url;

            const projectBody = {
                ...formData,
                audio_guia: url_final_audio
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
                alert(`Erro: ${data.mensagem}`);
            }
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content form_login" onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">Novo Projeto</h2>

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

                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label>BPM</label>
                            <input type="number" value={formData.bpm}
                                onChange={e => setFormData({ ...formData, bpm: e.target.value })}
                            />
                        </div>
                        <div className="form-group flex-1">
                            <label>Escala (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Ex: Am, C# Major"
                                value={formData.escala}
                                onChange={e => setFormData({ ...formData, escala: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="upload-group">
                        <label>Áudio Guia (MP3/WAV)</label>
                        <label className="file-drop-area">
                            <span className="upload-icon">🎵</span>
                            <span className="file-msg">
                                {file ? "Arquivo capturado!" : "Clique para selecionar o áudio"}
                            </span>
                            {file && <span className="file-name-badge">{file.name}</span>}
                            <input
                                type="file" accept="audio/*" required
                                className="modal-file-input"
                                onChange={e => setFile(e.target.files[0])}
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
                        <button type="submit" id="btn_envia" className="btn-modal-submit" disabled={loading}>
                            {loading ? 'Publicando...' : 'Publicar Projeto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export { CreateProjectModal };