import { URL_API_TESTE } from "../utility/url_apis";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Cadastro.css';
import { cadastroSchema } from '../schemas/cadastroSchema'
import { formatZodErrors } from '../utility/validationHelpers'

function Cadastro() {
    const navigate = useNavigate();
    const [nomeCompleto, setNomeCompleto] = useState("");
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [cpf, setCpf] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [loading, setLoading] = useState(false);

    async function cadastrar(e: React.FormEvent) {
        e.preventDefault();
        setErro('');
        setSucesso('');

        const result = cadastroSchema.safeParse({ nome_completo: nomeCompleto, email, senha, cpf })
        if (!result.success) {
            setErro(formatZodErrors(result.error) ?? 'Erro de validação')
            return
        }

        const { cpf: cpfLimpo } = result.data
        const usuario = { nome_completo: nomeCompleto, email, senha, cpf: cpfLimpo };

        setLoading(true);
        try {
            const cadastro = await fetch(`${URL_API_TESTE}/usuario`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(usuario)
            });

            const data = await cadastro.json();

            if (!cadastro.ok) {
                setErro("Erro ao cadastrar: " + (data.mensagem || data));
                return;
            }

            setSucesso("Cadastrado com sucesso!");
            setTimeout(() => navigate("/"), 1500);
        } catch (err) {
            console.error("Erro na requisição:", err);
            setErro("Erro de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="cadastro-page">
            <form className="form_login" onSubmit={cadastrar}>
                <h1 className="form-title">Criar Conta</h1>

                {erro && <div className="form-error" role="alert">{erro}</div>}
                {sucesso && <div className="form-error form-success" role="status">{sucesso}</div>}

                <div>
                    <label htmlFor="cad-nome">Nome Completo</label>
                    <input
                        id="cad-nome"
                        type="text"
                        value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        placeholder="Seu nome completo"
                        autoComplete="name"
                    />
                </div>

                <div>
                    <label htmlFor="cad-email">Email</label>
                    <input
                        id="cad-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        autoComplete="email"
                    />
                </div>

                <div>
                    <label htmlFor="cad-senha">Senha</label>
                    <input
                        id="cad-senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                    />
                </div>

                <div>
                    <label htmlFor="cad-cpf">CPF</label>
                    <input
                        id="cad-cpf"
                        placeholder="000.000.000-00"
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                    />
                </div>

                <button type="submit" className='btn-submit' disabled={loading}>
                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
            </form>
        </div>
    )
}

export default Cadastro;
