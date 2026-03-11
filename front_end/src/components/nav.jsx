// front_end\src\components\nav.jsx
import { Link, useNavigate } from 'react-router-dom';

function Nav() {
    const navigate = useNavigate();

    function logout() {
        localStorage.clear();
        navigate("/");
    }

    return (
        <nav>
            <ul>
                <li>
                    <Link to="/home">Feed Global</Link>
                </li>
                <li>
                    <Link to="/usuario">Meu Perfil</Link>
                </li>
                <li>
                    <Link to="/studio">Estúdio de Gravação</Link>
                </li>
                <li>
                    <button onClick={logout}>Sair</button>
                </li>
            </ul>
        </nav>
    );
}

export { Nav };