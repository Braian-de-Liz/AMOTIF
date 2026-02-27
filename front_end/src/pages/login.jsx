// front_end\src\pages\login.jsx
import { useState } from 'react';
import { validar_email } from '../utility/validar_email';
import { validar_cpf } from '../utility/validar_cpf';
import { Link } from 'react-router-dom';
import { URL_API, URL_API_TESTE } from '../utility/url_apis'

function Login() {

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

        class dados_para_logar {
            constructor(email, senha) {
                this.email = email;
                this.senha = senha;
            }
        }

        try {
            const dados_login = new dados_para_logar(email, senha);

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
            localStorage.setItem("usuario_nome", data.usuario.nome_completo);

            alert("Login realizado com sucesso!");

            // window.location.href='/home';
        }
        catch (erro) {
            console.error('Erro no login:', erro);
            alert('Erro ao fazer login: ' + erro.message);
        }
    }

    return (
        <>
            <h1>AMOTIF - Login</h1>

            <form className='form_login' onSubmit={request_log}>

                <div>
                    <label>Email</label>
                    <br />
                    <input type="email" value={email} onChange={(e) => Setemail(e.target.value)} />
                </div>

                <div>
                    <label>Senha</label>
                    <br />
                    <input type="password" value={senha} onChange={(e) => Setsenha(e.target.value)} />
                </div>

                <button type="submit" id='btn_envia'>Entrar</button>
            </form>

            <div style={{ marginTop: '5px' }}>
                <p>Não tem uma conta?</p>
                <Link to="/cadastro">Cadastrar-se</Link>
            </div>
        </>
    )
}

export { Login };