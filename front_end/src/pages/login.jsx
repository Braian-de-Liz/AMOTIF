import { useState } from 'react';
import '../styles/Login.css';
import { useNavigate, Link } from 'react-router-dom';
import { URL_API_TESTE } from '../utility/url_apis'
import { loginSchema } from '../schemas/loginSchema'
import { formatZodErrors } from '../utility/validationHelpers'

function Login() {

    const navigate = useNavigate(); 
    const [email, Setemail] = useState('');
    const [senha, Setsenha] = useState('');
    const [erro, setErro] = useState('');

    
    async function request_log(e) {
        e.preventDefault();
        setErro('');

        const result = loginSchema.safeParse({ email, senha })
        if (!result.success) {
            setErro(formatZodErrors(result.error))
            return
        }

        try {
            const dados_login = { email, senha };

            const try_login = await fetch(`${URL_API_TESTE}/usuario/login`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(dados_login)
            })

            const data = await try_login.json();

            if (!try_login.ok) {
                throw new Error(data.mensagem || 'Erro desconhecido');
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario_email", data.usuario.email);
            localStorage.setItem("usuario_id", data.usuario.id);
            localStorage.setItem("usuario_nome", data.usuario.nome);

            navigate("/home");
        }
        catch (erro) {
            console.error('Erro no login:', erro);
            setErro('Erro ao fazer login: ' + erro.message);
        }
    }

    return (
        <div className="login-page">
            <form className='form_login' onSubmit={request_log}>
                <h1 className="form-title">AMOTIF</h1>

                {erro && <div className="form-error" role="alert">{erro}</div>}

                <div>
                    <label>E-mail</label>
                    <input type="email" value={email} onChange={(e) => Setemail(e.target.value)} placeholder="seu@email.com" />
                </div>

                <div>
                    <label>Senha</label>
                    <input type="password" value={senha} onChange={(e) => Setsenha(e.target.value)} placeholder="••••••••" />
                </div>

                <button type="submit" className='btn-submit'>Entrar</button>
            </form>

            <div className='login-footer'>
                <p>Não tem uma conta?</p>
                <Link to="/cadastro">Cadastrar-se</Link>
            </div>
        </div>
    )
}

export { Login };
