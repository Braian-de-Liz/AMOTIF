import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Heart, Mail, LogOut, Mic } from 'lucide-react';
import { Notificacoes } from './pull_notifications';
import { URL_API_TESTE } from '../utility/url_apis';
import '../styles/Navbar.css';

function Nav() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => {
        if (path === '/home') return location.pathname === '/home';
        if (path === '/usuario') return location.pathname === '/usuario' || location.pathname.startsWith('/usuario/');
        if (path === '/novo-studio') return location.pathname === '/novo-studio';
        if (path === '/convites') return location.pathname === '/convites';
        if (path === '/favoritos') return location.pathname === '/favoritos';
        return false;
    };

    async function handleLogout() {
        try {
            await fetch(`${URL_API_TESTE}/usuario/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch {
        }
        finally {
            localStorage.clear();
            navigate('/');
        }
    }

    return (
        <nav className="nav-container">
            <ul>
                <li className="nav-brand-item">
                    <Link to="/home" className="nav-brand">
                        <img src="/assets/logo.fav.png" alt="AMOTIF" className="nav-brand-logo" />
                        <span>AMOTIF</span>
                    </Link>
                </li>

                <li className={isActive('/home') ? 'active' : ''}>
                    <Link to="/home">
                        <Home size={24} className="nav-icon" />
                        <span>Home</span>
                    </Link>
                </li>

                <li className={isActive('/novo-studio') ? 'active' : ''}>
                    <Link to="/novo-studio">
                        <Mic size={24} className="nav-icon" />
                        <span>Novo Studio</span>
                    </Link>
                </li>

                <li className={isActive('/usuario') ? 'active' : ''}>
                    <Link to="/usuario">
                        <User size={24} className="nav-icon" />
                        <span>Perfil</span>
                    </Link>
                </li>

                <li className={isActive('/convites') ? 'active' : ''}>
                    <Link to="/convites">
                        <Mail size={24} className="nav-icon" />
                        <span>Convites</span>
                    </Link>
                </li>

                <li className={isActive('/favoritos') ? 'active' : ''}>
                    <Link to="/favoritos">
                        <Heart size={24} className="nav-icon" />
                        <span>Favoritos</span>
                    </Link>
                </li>

                <li className="notifications-item">
                    <Notificacoes />
                </li>

                <li className="nav-logout-item">
                    <button onClick={handleLogout} className="nav-logout-btn" aria-label="Sair">
                        <LogOut size={24} className="nav-icon" />
                        <span>Sair</span>
                    </button>
                </li>

            </ul>
        </nav>
    );
}

export { Nav };
