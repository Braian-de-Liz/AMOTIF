import React from 'react';
import './styles/Global.css';
import './styles/Shared.css';
import './styles/Form.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';

const Login = React.lazy(() => import('./pages/login'));
const Cadastro = React.lazy(() => import('./pages/cadastro'));
const Home = React.lazy(() => import('./pages/home').then(m => ({ default: m.Home })));
const UserPage = React.lazy(() => import('./pages/user').then(m => ({ default: m.UserPage })));
const UserProfile = React.lazy(() => import('./pages/userProfile'));
const Studio = React.lazy(() => import('./pages/studio').then(m => ({ default: m.Studio })));
const InvitesPage = React.lazy(() => import('./pages/invitesPage').then(m => ({ default: m.InvitesPage })));
const FavoritesPage = React.lazy(() => import('./pages/favoritesPage').then(m => ({ default: m.FavoritesPage })));
const NotFound = React.lazy(() => import('./pages/notFound'));

function LoadingFallback() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
            color: 'var(--verde-musgo)',
            fontSize: '1.2rem',
        }}>
            Carregando...
        </div>
    );
}

function App() {
    return (
        <Router>
            <React.Suspense fallback={<LoadingFallback />}>
                <Routes>
                    <Route path='/' element={<Login />} />
                    <Route path='/cadastro' element={<Cadastro />} />

                    <Route element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }>
                        <Route path='/home' element={<Home />} />
                        <Route path='/usuario' element={<UserPage />} />
                        <Route path='/studio/:id' element={<Studio />} />
                        <Route path='/usuario/:id' element={<UserProfile />} />
                        <Route path='/convites' element={<InvitesPage />} />
                        <Route path='/favoritos' element={<FavoritesPage />} />
                    </Route>

                    <Route path='*' element={<NotFound />} />
                </Routes>
            </React.Suspense>
        </Router>
    );
}

export default App;
