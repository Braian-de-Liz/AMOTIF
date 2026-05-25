import { FavoritesList } from '../components/FavoritesList';
import { Heart } from 'lucide-react';
import '../styles/User.css';

function FavoritesPage() {
    const usuarioId = localStorage.getItem("usuario_id");

    return (
        <div className="favorites-page">
            <header className="page-header">
                <h1>
                    <Heart size={28} className="heart-icon" />
                    Meus Favoritos
                </h1>
                <p>Projetos que você marcou como favorito</p>
            </header>

            <main className="favorites-content">
                <FavoritesList userId={usuarioId} />
            </main>
        </div>
    );
}

export { FavoritesPage };
