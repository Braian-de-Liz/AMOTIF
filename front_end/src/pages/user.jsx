// front_end\src\pages\user.jsx
import { MyProjetosLoader } from '../components/MyLoadProjects';
import { Nav } from '../components/nav';

function UserPage() {
    const nomeUsuario = localStorage.getItem("usuario_nome");
    const emailUsuario = localStorage.getItem("usuario_email");

    return (
        <div className="user-dashboard">
            <Nav />
            
            <header className="user-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                <h1>Minha Estante Musical</h1>
                <p>Bem-vindo de volta, <strong>{nomeUsuario}</strong> ({emailUsuario})</p>
                <hr />
            </header>

            <section className="my-projects-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Meus Projetos</h2>
                    <button className="btn-create-proj">+ Novo Projeto</button>
                </div>
                
                <MyProjetosLoader />
            </section>
        </div>
    )
}

export { UserPage };