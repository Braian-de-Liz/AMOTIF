import { Nav } from "../components/nav";
import { Feed } from "../components/feed";

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