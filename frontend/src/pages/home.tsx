import { Feed } from "../components/feed";
import '../styles/Home.css';
import { SEOHead } from '../components/SEOHead';

function Home() {
    return (
        <main className="home-content">
            <SEOHead
                title="Feed"
                description="Descubra projetos musicais, encontre músicos e colabore em tempo real na AMOTIF."
                url="/home"
            />
            <Feed />
        </main>
    );
}

export { Home };
