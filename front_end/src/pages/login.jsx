// front_end\src\pages\login.jsx
import { useState } from 'react';
import '../styles/Login.css';
import { validar_email } from '../utility/validar_email';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { URL_API, URL_API_TESTE } from '../utility/url_apis'

function Login() {

    const navigate = useNavigate(); 
    const [email, Setemail] = useState('');
    const [senha, Setsenha] = useState('');

    
    async function request_log(e) {
        e.preventDefault();

        if (!validar_email(email)) {
            alert("email inválido");
            return false;
        }
    
        if (senha.length < 8) {
            alert("A senha deve ter pelo menos 8 caracteres.");
            return false;
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
            alert('Erro ao fazer login: ' + erro.message);
        }
    }

    return (
        <div className="login-page">
            <form className='form_login' onSubmit={request_log}>
                <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.8rem' }}>AMOTIF</h1>

                <div>
                    <label>Email</label>
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