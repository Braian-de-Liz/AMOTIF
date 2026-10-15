import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../utility/apiClient';
import { SEOHead } from '../components/SEOHead';
import '../styles/JoinInvite.css';

interface InvitePreview {
    projeto: { id: string; titulo: string; genero: string };
    cargo: string;
    convidado_por: string;
    expira_em: string;
}

function JoinInvite() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [preview, setPreview] = useState<InvitePreview | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        if (!token) return;
        api.get<InvitePreview>(`/invite-link/${token}`)
            .then(setPreview)
            .catch(err => setErro(err instanceof Error ? err.message : 'Link inválido.'))
            .finally(() => setLoading(false));
    }, [token]);

    const handleJoin = async () => {
        setJoining(true);
        setErro(null);
        try {
            const data = await api.post<{ projetoId: string }>(`/invite-link/${token}`, {});
            navigate(`/studio/${data.projetoId}`);
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Não foi possível entrar no projeto.');
            setJoining(false);
        }
    };

    if (loading) return <div className="loading-txt">Verificando convite...</div>;

    return (
        <div className="join-invite">
            <SEOHead title="Convite para projeto" description="Convite para colaborar em um projeto no AMOTIF." url={`/convite/${token}`} />
            <div className="join-invite-card">
                {preview ? (
                    <>
                        <p className="join-invite-eyebrow">Convite para colaborar</p>
                        <h1>{preview.projeto.titulo}</h1>
                        <p className="join-invite-text">
                            {preview.convidado_por} convidou você para este projeto como{' '}
                            <span className="join-invite-role">{preview.cargo}</span>.
                        </p>
                        <button className="join-invite-button" onClick={handleJoin} disabled={joining}>
                            {joining ? 'Entrando...' : 'Entrar no projeto'}
                        </button>
                    </>
                ) : (
                    <>
                        <h1>Convite indisponível</h1>
                        <p className="join-invite-text">Peça um novo link a quem convidou você.</p>
                    </>
                )}
                {erro && <div className="join-invite-error" role="alert">{erro}</div>}
                {!preview && <Link className="join-invite-back" to="/home">Voltar para o início</Link>}
            </div>
        </div>
    );
}

export default JoinInvite;
