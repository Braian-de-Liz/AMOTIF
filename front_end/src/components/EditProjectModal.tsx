import { useState, useEffect } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';
import { projectSchema, generos } from '../schemas/projectSchema';
import { formatZodErrors } from '../utility/validationHelpers';
import { Modal } from './Modal';
import { Pencil } from 'lucide-react';
import type { Project } from '../types';

interface EditProjectModalProps {
    projeto: Project
    isOpen: boolean
    onClose: () => void
    onUpdated: (projeto: Project) => void
}

function EditProjectModal({ projeto, isOpen, onClose, onUpdated }: EditProjectModalProps) {
    const token = localStorage.getItem("token");

    const [titulo, setTitulo] = useState(projeto.titulo);
    const [genero, setGenero] = useState(projeto.genero);
    const [bpm, setBpm] = useState(projeto.bpm);
    const [escala, setEscala] = useState(projeto.escala ?? '');
    const [descricao, setDescricao] = useState(projeto.descricao ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTitulo(projeto.titulo);
            setGenero(projeto.genero);
            setBpm(projeto.bpm);
            setEscala(projeto.escala ?? '');
            setDescricao(projeto.descricao ?? '');
            setError(null);
        }
    }, [isOpen, projeto]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const validate = projectSchema.safeParse({ titulo, genero, bpm, escala: escala || undefined, descricao: descricao || undefined });
        if (!validate.success) {
            setError(formatZodErrors(validate.error));
            return;
        }

        if (!token) return;

        setSaving(true);
        try {
            const res = await fetch(`${URL_API_TESTE}/projetos/${projeto.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    titulo,
                    genero,
                    bpm,
                    escala: escala || null,
                    descricao: descricao || null
                })
            });
            const data = await res.json();

            if (res.ok) {
                onUpdated({ ...projeto, ...data.projeto });
                onClose();
            } else {
                setError(data.mensagem || "Erro ao atualizar projeto.");
            }
        } catch {
            setError("Erro de conexão.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Projeto" titleId="edit-project-title">
            {error && <div className="form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="edit-titulo">Título</label>
                    <input
                        id="edit-titulo"
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        required
                        minLength={3}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group flex-1">
                        <label htmlFor="edit-genero">Gênero</label>
                        <select
                            id="edit-genero"
                            className="custom-select"
                            value={genero}
                            onChange={(e) => setGenero(e.target.value)}
                            required
                        >
                            {generos.map(g => (
                                <option key={g} value={g}>
                                    {g.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group flex-1">
                        <label htmlFor="edit-bpm">BPM</label>
                        <input
                            id="edit-bpm"
                            type="number"
                            value={bpm}
                            onChange={(e) => setBpm(Number(e.target.value))}
                            min={40}
                            max={300}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="edit-escala">Escala / Tonalidade</label>
                    <input
                        id="edit-escala"
                        type="text"
                        value={escala}
                        onChange={(e) => setEscala(e.target.value)}
                        placeholder="Ex: C Maior, Am, G"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="edit-descricao">Descrição</label>
                    <textarea
                        id="edit-descricao"
                        className="modal-textarea"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descreva o projeto..."
                        rows={3}
                    />
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-confirm" disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export { EditProjectModal };
