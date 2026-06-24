import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { URL_API_TESTE } from '../utility/url_apis';
import type { User } from '../types';

function BioEditor() {
    const usuarioId = localStorage.getItem("usuario_id");
    const token = localStorage.getItem("token");

    const { data, loading } = useApi<{ usuario: User }>(
        `/usuario/${usuarioId}/completo`,
        { immediate: !!usuarioId && !!token }
    );

    const [bio, setBio] = useState('');
    const [originalBio, setOriginalBio] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    const MAX_CHARS = 500;

    if (data?.usuario && !initialized) {
        const u = data.usuario;
        setBio(u.bio ?? '');
        setOriginalBio(u.bio ?? '');
        setInitialized(true);
    }

    async function handleSave() {
        if (!usuarioId || !token) return;
        setSaving(true);
        setError(null);

        const payload = bio.trim() === '' ? null : bio.trim();

        try {
            const res = await fetch(`${URL_API_TESTE}/usuario_bio/${usuarioId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bio: payload })
            });
            const result = await res.json();
            if (res.ok) {
                setOriginalBio(payload);
                setBio(payload ?? '');
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
        setBio(originalBio ?? '');
        setEditing(false);
        setError(null);
    }

    if (loading) return <div className="loading">Carregando bio...</div>;
    if (!data?.usuario) return null;

    return (
        <div className="bio-editor">
            {!editing ? (
                <div className="bio-display">
                    {originalBio ? (
                        <p className="bio-text">{originalBio}</p>
                    ) : (
                        <p className="bio-empty">Nenhuma bio ainda.</p>
                    )}
                    <button
                        className="bio-edit-btn"
                        onClick={() => setEditing(true)}
                    >
                        Editar Bio
                    </button>
                </div>
            ) : (
                <div className="bio-edit-area">
                    <textarea
                        className="bio-textarea"
                        value={bio}
                        onChange={(e) => {
                            if (e.target.value.length <= MAX_CHARS) {
                                setBio(e.target.value);
                            }
                        }}
                        placeholder="Conte um pouco sobre você como músico..."
                        rows={4}
                    />
                    <div className="bio-edit-footer">
                        <span className="bio-char-count">
                            {bio.length}/{MAX_CHARS}
                        </span>
                        <div className="bio-actions">
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

export { BioEditor };
