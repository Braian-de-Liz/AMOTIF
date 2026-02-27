// front_end\src\pages\cadastro.jsx
import { URL_API_TESTE } from "../utility/url_apis";
import { validar_cpf } from "../utility/validar_cpf";
import { validar_email } from "../utility/validar_email";
import { useState } from "react";
import { useNavigate } from "react-router-dom"; 

function Cadastro() {

    const navigate = useNavigate(); 
    const [nome_completo, Setnome_completo] = useState("");
    const [email, Setemail] = useState('');
    const [senha, Setsenha] = useState('');
    const [cpf, Setcpf] = useState('');

    async function cadastrar(e) {
        e.preventDefault();

        if(!nome_completo || !email || !senha || !cpf){
            alert("preencha os dados para cadastrar-se");
            return false;
        }

        
        if (!validar_email(email)) {
            alert("email inválido");
            return false;
        }
        
        const cpfLimpo = cpf.replace(/\D/g, '');
        if (!validar_cpf(cpfLimpo)) {
            alert("cpf inválido");
            return false;
        }


        const usuario = { nome_completo, email, senha, cpf: cpfLimpo };

        try{
            const cadastro = await fetch(`${URL_API_TESTE}/usuario`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(usuario)
            });

            const data = await cadastro.json().catch(() => cadastro.text());

            if(!cadastro.ok){
                alert("erro ao cadastrar :" + data);
                return false;
            }

            alert("cadastrado com sucesso");
            navigate("/");
        }

        catch(erro) {
            console.error("Erro na requisição:", erro);
            alert("Erro de conexão com o servidor.");
        }
    }

    return (
        <>
            <form action="form_login" onSubmit={cadastrar}>

                <div>
                    <label>Nome Completo</label>
                    <br />
                    <input type="text" value={nome_completo} onChange={(e) => Setnome_completo(e.target.value)} placeholder="minimo 6"/>
                </div>

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

                <div>
                    <label>cpf</label>
                    <br />
                    <input placeholder="000.000.000-00" type="text" value={cpf} onChange={(e) => Setcpf(e.target.value)} />
                </div>

                <br />
                <button type="submit" id='btn_envia'>Cadastrar</button>
            </form>
        </>
    )
}

export { Cadastro };