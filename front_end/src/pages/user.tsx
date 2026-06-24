import { useState } from 'react';
import { MyProjectsList } from '../components/MyLoadProjects';
import { CreateProjectModal } from '../components/init_project';
import { FollowersList, UserStats } from '../components/FollowersComponents';
import { BioEditor } from '../components/BioEditor';
import { InstrumentEditor } from '../components/InstrumentEditor';
import { ChangePassword } from '../components/ChangePassword';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { Lock, Trash2 } from 'lucide-react';
import '../styles/User.css';

function UserPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const nomeUsuario = localStorage.getItem("usuario_nome");
    const usuarioId = localStorage.getItem("usuario_id");

    return (
        <div className="user-dashboard">

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
                    <button
                        className="btn-create-proj"
                        onClick={() => setIsModalOpen(true)}
                    >
                        + Novo Projeto
                    </button>
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
