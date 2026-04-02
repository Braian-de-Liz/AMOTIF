import { Nav } from "../components/nav";
import { Feed } from "../components/feed";
import '../styles/Home.css';

function Home() {
    return (
        <>
            <Nav />
            <main className="home-content">
                <Feed />
            </main>
        </>
    );
}

export { Home };