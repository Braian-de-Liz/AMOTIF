import { Outlet } from 'react-router-dom';
import { Nav } from './nav';
import { FloatingNotifications } from './FloatingNotifications';

function AppLayout() {
    return (
        <>
            <Nav />
            <Outlet />
            <FloatingNotifications />
        </>
    );
}

export { AppLayout };