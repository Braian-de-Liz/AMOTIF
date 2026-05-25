import { URL_API_TESTE } from "../utility/url_apis";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Cadastro.css';
import { cadastroSchema } from '../schemas/cadastroSchema'
import { formatZodErrors } from '../utility/validationHelpers'

function Cadastro() {

    const navigate = useNavigate();
    const [nome_completo, Setnome_completo] = useState("");
    const [email, Setemail] = useState('');
    const [senha, Setsenha] = useState('');
    const [cpf, Setcpf] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

    async function cadastrar(e: React.FormEvent) {
        e.preventDefault();
        setErro('');
        setSucesso('');

        const result = cadastroSchema.safeParse({ nome_completo, email, senha, cpf })
        if (!result.success) {
            setErro(formatZodErrors(result.error) ?? 'Erro de validação')
            return
        }

        const { cpf: cpfLimpo } = result.data
        const usuario = { nome_completo, email, senha, cpf: cpfLimpo };

        try {
            const cadastro = await fetch(`${URL_API_TESTE}/usuario`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(usuario)
            });

            const data = await cadastro.json().catch(() => cadastro.text());

            if (!cadastro.ok) {
                setErro("Erro ao cadastrar: " + data);
                return;
            }

            setSucesso("Cadastrado com sucesso!");
            setTimeout(() => navigate("/"), 1500);
        }

        catch (erro) {
            console.error("Erro na requisição:", erro);
            setErro("Erro de conexão com o servidor.");
        }
    }

    return (
        <div className="cadastro-page">
            <form className="form_login" onSubmit={cadastrar}>
                <h1 className="form-title">Criar Conta</h1>

                {erro && <div className="form-error" role="alert">{erro}</div>}
                {sucesso && <div className="form-error" role="status" style={{ backgroundColor: 'var(--sucesso-bg)', color: 'var(--sucesso-texto)', borderColor: 'var(--sucesso)' }}>{sucesso}</div>}

                <div>
                    <label>Nome Completo</label>
                    <input type="text" value={nome_completo} onChange={(e) => Setnome_completo(e.target.value)} placeholder="Seu nome completo" />
                </div>

                <div>
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => Setemail(e.target.value)} placeholder="seu@email.com" />
                </div>

                <div>
                    <label>Senha</label>
                    <input type="password" value={senha} onChange={(e) => Setsenha(e.target.value)} placeholder="Mínimo 8 caracteres" />
                </div>

                <div>
                    <label>CPF</label>
                    <input placeholder="000.000.000-00" type="text" value={cpf} onChange={(e) => Setcpf(e.target.value)} />
                </div>

                <button type="submit" className='btn-submit'>Cadastrar</button>
            </form>
        </div>
    )
}

export { Cadastro };
