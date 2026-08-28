import { useState } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import { URL_API_TESTE } from '../utility/url_apis';

function BioEditor() {
    const { usuario, loading } = useUserData();
    const usuarioId = usuario?.id || '';

    const [bio, setBio] = useState('');
    const [originalBio, setOriginalBio] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    const MAX_CHARS = 500;

    if (usuario && !initialized) {
        setBio(usuario.bio ?? '');
        setOriginalBio(usuario.bio ?? '');
        setInitialized(true);
    }

    async function handleSave() {
        if (!usuarioId) return;
        setSaving(true);
        setError(null);

        const payload = bio.trim() === '' ? null : bio.trim();

        try {
            const res = await fetch(`${URL_API_TESTE}/usuario_bio/${usuarioId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
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
    if (!usuario) return null;

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
