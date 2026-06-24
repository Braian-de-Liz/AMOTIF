import { useState } from 'react';
import '../styles/Login.css';
import { useNavigate, Link } from 'react-router-dom';
import { URL_API_TESTE } from '../utility/url_apis'
import { loginSchema } from '../schemas/loginSchema'
import { formatZodErrors } from '../utility/validationHelpers'
import { SEOHead } from '../components/SEOHead'
import { Music, LogIn } from 'lucide-react';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    async function requestLog(e: React.FormEvent) {
        e.preventDefault();
        setErro('');

        const result = loginSchema.safeParse({ email, senha })
        if (!result.success) {
            setErro(formatZodErrors(result.error) ?? 'Erro de validação')
            return
        }

        setLoading(true);
        try {
            const dadosLogin = { email, senha };

            const tryLogin = await fetch(`${URL_API_TESTE}/usuario/login`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(dadosLogin)
            })

            const data = await tryLogin.json();

            if (!tryLogin.ok) {
                throw new Error(data.mensagem || 'Erro desconhecido');
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario_email", data.usuario.email);
            localStorage.setItem("usuario_id", data.usuario.id);
            localStorage.setItem("usuario_nome", data.usuario.nome);

            navigate("/home");
        } catch (err) {
            console.error('Erro no login:', err);
            setErro('Erro ao fazer login: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <SEOHead
                title="Entrar"
                description="Acesse sua conta na AMOTIF e comece a colaborar com músicos de todo o Brasil."
                url="/"
            />
            <div className="login-hero">
                <div className="login-hero-icon">
                    <Music size={36} />
                </div>
                <h2>Bem-vindo de volta</h2>
                <p>Entre na sua conta e continue criando música com colaboradores de todo o Brasil.</p>
            </div>

            <div className="login-form-wrapper">
                <form className='form_login' onSubmit={requestLog}>
                    <h1 className="form-title">Entrar</h1>

                    {erro && <div className="form-error" role="alert">{erro}</div>}

                    <div>
                        <label htmlFor="login-email">E-mail</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label htmlFor="login-senha">Senha</label>
                        <input
                            id="login-senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className='btn-submit' disabled={loading}>
                        {loading ? 'Entrando...' : <><LogIn size={18} /> Entrar</>}
                    </button>
                </form>

                <div className='login-footer'>
                    <p>Não tem uma conta?</p>
                    <Link to="/cadastro">Cadastrar-se</Link>
                </div>
            </div>
        </div>
    )
}

export default Login;
