import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Home } from 'lucide-react';
import '../styles/Home.css';

function NotFound() {
    return (
        <main className="home-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
            <SEOHead
                title="Página Não Encontrada"
                description="A página que você procura não existe ou foi movida."
                url="/404"
            />
            <h1 style={{ fontSize: '6rem', color: 'var(--verde-medio)', margin: 0 }}>404</h1>
            <h2 style={{ color: 'var(--verde-escuro)', marginBottom: '1rem' }}>Página não encontrada</h2>
            <p style={{ color: 'var(--texto-secundario)', marginBottom: '2rem', maxWidth: '400px' }}>
                O endereço que você procura não existe ou foi movido para outro local.
            </p>
            <Link
                to="/home"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.8rem 1.8rem',
                    backgroundColor: 'var(--verde-medio)',
                    color: 'white',
                    borderRadius: '40px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                }}
            >
                <Home size={18} />
                Voltar ao Início
            </Link>
        </main>
    );
}

export default NotFound;
