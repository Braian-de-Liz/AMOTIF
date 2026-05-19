import { useState } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';

function UserCard({ user, onClick }) {
    const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);

    const handleFollow = async (e) => {
        e.stopPropagation();
        
        try {
            const token = localStorage.getItem("token");
            const method = isFollowing ? 'DELETE' : 'POST';
            
            const response = await fetch(`${URL_API_TESTE}/follows/${user.id}`, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setIsFollowing(!isFollowing);
            }
        } catch (err) {
            console.error("Erro ao seguir/deixar de seguir:", err);
        }
    };

    return (
        <div className="user-card" onClick={onClick}>
            <div className="user-card-avatar">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.nome_completo} />
                ) : (
                    <div className="avatar-placeholder">
                        {user.nome_completo?.charAt(0).toUpperCase() || '?'}
                    </div>
                )}
            </div>
            
            <div className="user-card-info">
                <h4>{user.nome_completo}</h4>
                {user.bio && <p className="user-bio">{user.bio}</p>}
                
                {user.instrumentos && user.instrumentos.length > 0 && (
                    <div className="user-instruments">
                        {user.instrumentos.slice(0, 3).map((inst, idx) => (
                            <span key={idx} className="instrument-tag">{inst}</span>
                        ))}
                        {user.instrumentos.length > 3 && (
                            <span className="instrument-more">+{user.instrumentos.length - 3}</span>
                        )}
                    </div>
                )}
            </div>

            <button 
                className={`btn-follow ${isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
            >
                {isFollowing ? 'Seguindo' : 'Seguir'}
            </button>
        </div>
    );
}

export { UserCard };