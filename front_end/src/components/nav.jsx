import { Link, useLocation } from 'react-router-dom';
import { Home, User, Music, Heart, Mail } from 'lucide-react';
import { Notificacoes } from './pull_notifications';
import '../styles/Navbar.css';

function Nav() {
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/home') return location.pathname === '/home';
        if (path === '/usuario') return location.pathname === '/usuario' || location.pathname.startsWith('/usuario/');
        if (path === '/convites') return location.pathname === '/convites';
        if (path === '/favoritos') return location.pathname === '/favoritos';
        return false;
    };

    return (
        <nav className="nav-container">
            <ul>

                <li className={isActive('/home') ? 'active' : ''}>
                    <Link to="/home">
                        <Home size={24} className="nav-icon" />
                        <span>Home</span>
                    </Link>
                </li>

                <li className={isActive('/usuario') ? 'active' : ''}>
                    <Link to="/usuario">
                        <User size={24} className="nav-icon" />
                        <span>Perfil</span>
                    </Link>
                </li>

                <li className={location.pathname.startsWith('/studio') ? 'active' : ''}>
                    <Link to={localStorage.getItem('usuario_id') ? `/studio/${localStorage.getItem('usuario_id')}` : '/home'}>
                        <Music size={24} className="nav-icon" />
                        <span>Estúdio</span>
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
                
            </ul>
        </nav>
    );
}

export { Nav };