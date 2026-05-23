import { Outlet } from 'react-router-dom';
import { Nav } from './nav';

function AppLayout() {
    return (
        <>
            <Nav />
            <Outlet />
        </>
    );
}

export { AppLayout };