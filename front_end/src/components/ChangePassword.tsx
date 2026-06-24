import { useState } from 'react';
import { Modal } from './Modal';
import { passwordSchema } from '../schemas/passwordSchema';
import { formatZodErrors } from '../utility/validationHelpers';
import { Lock } from 'lucide-react';
import { URL_API_TESTE } from '../utility/url_apis';

interface ChangePasswordProps {
    isOpen: boolean
    onClose: () => void
}

function ChangePassword({ isOpen, onClose }: ChangePasswordProps) {
    const token = localStorage.getItem("token");

    const [senha, setSenha] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);

    function handleClose() {
        setSenha('');
        setNovaSenha('');
        setConfirmarSenha('');
        setError(null);
        setSucesso(null);
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSucesso(null);

        const validate = passwordSchema.safeParse({ senha, nova_senha: novaSenha, confirmar_senha: confirmarSenha });
        if (!validate.success) {
            setError(formatZodErrors(validate.error));
            return;
        }

        if (!token) {
            setError("Sessão expirada.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`${URL_API_TESTE}/forgot/password`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ senha, nova_senha: novaSenha })
            });
            const data = await res.json();

            if (res.ok) {
                setSucesso('Senha alterada com sucesso!');
                setTimeout(() => handleClose(), 1500);
            } else {
                setError(data.mensagem || "Erro ao alterar senha.");
            }
        } catch {
            setError("Erro de conexão.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Trocar Senha" titleId="change-password-title">
            {error && <div className="form-error">{error}</div>}
            {sucesso && <div className="form-error form-success">{sucesso}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="senha-atual">Senha Atual</label>
                    <input
                        id="senha-atual"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Digite sua senha atual"
                        required
                        minLength={8}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="nova-senha">Nova Senha</label>
                    <input
                        id="nova-senha"
                        type="password"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Digite a nova senha"
                        required
                        minLength={8}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirmar-senha">Confirmar Nova Senha</label>
                    <input
                        id="confirmar-senha"
                        type="password"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        placeholder="Confirme a nova senha"
                        required
                        minLength={8}
                    />
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={handleClose} disabled={saving}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-confirm" disabled={saving}>
                        {saving ? 'Salvando...' : 'Trocar Senha'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export { ChangePassword };
