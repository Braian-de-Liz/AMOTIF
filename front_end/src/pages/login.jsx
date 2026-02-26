import { useState } from 'react';
import { URL_API, URL_API_TESTE } from '../utility/url_apis'

function Login() {

    const [email, Setemail] = useState('');
    const [senha, Setsenha] = useState('');

    async function request_log(e) {
        e.preventDefault();

        class dados_para_logar {
            constructor(email, senha) {
                this.email = email;
                this.senha = senha;
            }
        }

        try {
            const dados_login = new dados_para_logar(email, senha);

            const try_login = await fetch(`${URL_API_TESTE}/api/usuario/login`, {
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
                    {/* Conectando o input ao Estado do React */}
                    <input type="email" value={email} onChange={(e) => Setemail(e.target.value)}/>
                </div>

                <div>
                    <label>Senha</label>
                    <br />
                    <input type="password" value={senha} onChange={(e) => Setsenha(e.target.value)}/>
                </div>

                {/* No formulário, o botão deve ser do tipo submit */}
                <button type="submit" id='btn_envia'>Entrar</button>
            </form>

        </>
    )
}

export { Login };