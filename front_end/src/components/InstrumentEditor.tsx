import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { URL_API_TESTE } from '../utility/url_apis';
import { X } from 'lucide-react';
import { instrumentSchema } from '../schemas/instrumentSchema';
import { formatZodErrors } from '../utility/validationHelpers';
import type { User } from '../types';

function InstrumentEditor() {
    const usuarioId = localStorage.getItem("usuario_id");
    const token = localStorage.getItem("token");

    const { data, loading } = useApi<{ usuario: User }>(
        `/usuario/${usuarioId}/completo`,
        { immediate: !!usuarioId && !!token }
    );

    const [instrumentos, setInstrumentos] = useState<string[]>([]);
    const [originalInstrumentos, setOriginalInstrumentos] = useState<string[]>([]);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [novoInstrumento, setNovoInstrumento] = useState('');
    const [initialized, setInitialized] = useState(false);

    if (data?.usuario && !initialized) {
        const inst = data.usuario.instrumentos ?? [];
        setInstrumentos(inst);
        setOriginalInstrumentos(inst);
        setInitialized(true);
    }

    function handleAddInstrumento() {
        const valor = novoInstrumento.trim();
        if (!valor) return;
        if (instrumentos.includes(valor)) {
            setError("Este instrumento já foi adicionado.");
            setTimeout(() => setError(null), 3000);
            return;
        }
        if (instrumentos.length >= 10) {
            setError("Máximo de 10 instrumentos.");
            setTimeout(() => setError(null), 3000);
            return;
        }
        setInstrumentos(prev => [...prev, valor]);
        setNovoInstrumento('');
        setError(null);
    }

    function handleRemoveInstrumento(index: number) {
        setInstrumentos(prev => prev.filter((_, i) => i !== index));
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddInstrumento();
        }
    }

    async function handleSave() {
        if (!usuarioId || !token) return;

        const validate = instrumentSchema.safeParse({ instrumentos });
        if (!validate.success) {
            setError(formatZodErrors(validate.error));
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`${URL_API_TESTE}/usuario/${usuarioId}/instrumentos`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ instrumentos })
            });
            const result = await res.json();
            if (res.ok) {
                setOriginalInstrumentos([...instrumentos]);
                setEditing(false);
            } else {
                setError(result.mensagem || "Erro ao salvar.");
            }
        } catch {
            setError("Erro de conexão.");
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        setInstrumentos([...originalInstrumentos]);
        setNovoInstrumento('');
        setEditing(false);
        setError(null);
    }

    if (loading) return <div className="loading">Carregando instrumentos...</div>;
    if (!data?.usuario) return null;

    return (
        <div className="instrument-editor">
            {!editing ? (
                <div className="instrument-display">
                    {originalInstrumentos.length > 0 ? (
                        <div className="instrument-tags">
                            {originalInstrumentos.map((inst, i) => (
                                <span key={i} className="instrument-tag">{inst}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="instrument-empty">Nenhum instrumento cadastrado.</p>
                    )}
                    <button
                        className="instrument-edit-btn"
                        onClick={() => setEditing(true)}
                    >
                        Editar Instrumentos
                    </button>
                </div>
            ) : (
                <div className="instrument-edit-area">
                    <div className="instrument-tags editable">
                        {instrumentos.map((inst, i) => (
                            <span key={i} className="instrument-tag removable">
                                {inst}
                                <button
                                    className="instrument-tag-remove"
                                    onClick={() => handleRemoveInstrumento(i)}
                                    aria-label={`Remover ${inst}`}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>

                    <div className="instrument-add-row">
                        <input
                            type="text"
                            className="instrument-input"
                            value={novoInstrumento}
                            onChange={(e) => setNovoInstrumento(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite o nome do instrumento..."
                            maxLength={50}
                        />
                        <button
                            type="button"
                            className="btn-add-instrument"
                            onClick={handleAddInstrumento}
                            disabled={!novoInstrumento.trim()}
                        >
                            Adicionar
                        </button>
                    </div>

                    <div className="instrument-edit-footer">
                        <span className="instrument-count">
                            {instrumentos.length}/10 instrumentos
                        </span>
                        <div className="instrument-actions">
                            <button
                                className="btn-modal-cancel"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-modal-submit"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Salvando..." : "Salvar"}
                            </button>
                        </div>
                    </div>
                    {error && <p className="error-msg">{error}</p>}
                </div>
            )}
        </div>
    );
}

export { InstrumentEditor };
