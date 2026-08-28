import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MyProjectsList } from '../components/MyLoadProjects';
import { CreateProjectModal } from '../components/init_project';
import { FollowersList, UserStats } from '../components/FollowersComponents';
import { BioEditor } from '../components/BioEditor';
import { InstrumentEditor } from '../components/InstrumentEditor';
import { ChangePassword } from '../components/ChangePassword';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { useUserData } from '../contexts/UserDataContext';
import { Lock, Trash2, Mic } from 'lucide-react';
import '../styles/User.css';
import { SEOHead } from '../components/SEOHead';

function UserPage() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { usuario } = useUserData();

    const nomeUsuario = usuario?.nome_completo || '';
    const usuarioId = usuario?.id || '';

    return (
        <div className="user-dashboard">
            <SEOHead
                title="Minha Estante Musical"
                description="Gerencie seus projetos, configure seu perfil e acompanhe seus seguidores na AMOTIF."
                url="/usuario"
            />

            <header className="user-header">
                <h1>Minha Estante Musical</h1>
                <p>Bem-vindo de volta, <strong>{nomeUsuario}</strong></p>
                <BioEditor />
                <InstrumentEditor />
                <UserStats userId={usuarioId} />
                <hr />
            </header>

            <section className="followers-section-container">
                <FollowersList userId={usuarioId} />
            </section>

            <section className="my-projects-section">
                <div className="section-header">
                    <h2>Meus Projetos</h2>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button
                            className="btn-create-proj"
                            onClick={() => navigate('/novo-studio')}
                            style={{ background: 'transparent', color: 'var(--verde-musgo)', border: '1px solid rgba(92, 122, 68, 0.2)' }}
                        >
                            <Mic size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Novo Studio
                        </button>
                        <button
                            className="btn-create-proj"
                            onClick={() => setIsModalOpen(true)}
                        >
                            + Novo Projeto
                        </button>
                    </div>
                </div>

                <MyProjectsList key={refreshKey} />
            </section>

            <section className="account-settings-section">
                <h2>Configurações da Conta</h2>
                <div className="account-actions">
                    <button
                        className="btn-account-action"
                        onClick={() => setShowPasswordModal(true)}
                    >
                        <Lock size={18} />
                        Trocar Senha
                    </button>
                    <button
                        className="btn-account-action btn-danger-outline"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        <Trash2 size={18} />
                        Excluir Conta
                    </button>
                </div>
            </section>

            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProjectCreated={() => setRefreshKey(old => old + 1)}
            />

            <ChangePassword
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />

            <DeleteAccountModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
            />
        </div>
    )
}

export { UserPage };
