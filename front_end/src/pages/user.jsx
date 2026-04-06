import { useState } from 'react'; 
import { MyProjetosLoader } from '../components/MyLoadProjects';
import { Nav } from '../components/nav';
import { CreateProjectModal } from '../components/init_project';
import { FollowersList, UserStats } from '../components/FollowersComponents';
import '../styles/User.css';

function UserPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); 

    const nomeUsuario = localStorage.getItem("usuario_nome");
    const usuarioId = localStorage.getItem("usuario_id");

    return (
        <div className="user-dashboard">
            <Nav />
            
            <header className="user-header">
                <h1>Minha Estante Musical</h1>
                <p>Bem-vindo de volta, <strong>{nomeUsuario}</strong></p>
                <UserStats userId={usuarioId} />
                <hr />
            </header>

            <section className="followers-section-container">
                <FollowersList userId={usuarioId} />
            </section>

            <section className="my-projects-section">
                <div className="section-header">
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
