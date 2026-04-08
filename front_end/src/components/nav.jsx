import { Link, useLocation } from 'react-router-dom';
import { Home, User, Music } from 'lucide-react';
import { Notificacoes } from './pull_notifications';
import '../styles/Navbar.css';

function Nav() {
    const location = useLocation();


    return (
        <nav className="nav-container">
            <ul>

                <li className={location.pathname === '/home' ? 'active' : ''}>
                    <Link to="/home">
                        <Home size={24} className="nav-icon" />
                        <span>Home</span>
                    </Link>
                </li>

                <li className={location.pathname === '/usuario' ? 'active' : ''}>
                    <Link to="/usuario">
                        <User size={24} className="nav-icon" />
                        <span>Perfil</span>
                    </Link>
                </li>

                <li className={location.pathname === '/studio' ? 'active' : ''}>
                    <Link to="/studio">
                        <Music size={24} className="nav-icon" />
                        <span>Estúdio</span>
                    </Link>
                </li>

                <li className="notifications-item">
                    <Notificacoes />
                </li>
                
            </ul>
        </nav>
    );
}

export { Nav };