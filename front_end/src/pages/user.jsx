import { useState } from 'react'; 
import { MyProjetosLoader } from '../components/MyLoadProjects';
import { Nav } from '../components/nav';
import { CreateProjectModal } from '../components/init_project';

function UserPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); 

    const nomeUsuario = localStorage.getItem("usuario_nome");
    const emailUsuario = localStorage.getItem("usuario_email");

    return (
        <div className="user-dashboard">
            <Nav />
            
            <header className="user-header">
                <h1>Minha Estante Musical</h1>
                <p>Bem-vindo de volta, <strong>{nomeUsuario}</strong></p>
                <hr />
            </header>

            <section className="my-projects-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Meus Projetos</h2>
                    <button 
                        className="btn-create-proj"
                        onClick={() => setIsModalOpen(true)}
                    >
                        + Novo Projeto
                    </button>
                </div>
                
                <MyProjetosLoader key={refreshKey} />
            </section>

            {/* MODAL */}
            <CreateProjectModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onProjectCreated={() => setRefreshKey(old => old + 1)} 
            />
        </div>
    )
}

export { UserPage };