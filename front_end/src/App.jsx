// front_end\src\App.jsx
import './styles/Global.css';
import './styles/Shared.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login } from './pages/login';
import { Cadastro } from './pages/cadastro';
import { Home } from './pages/home';
import { UserPage } from './pages/user';
import { UserProfile } from './pages/userProfile';
import { Studio } from './pages/studio';
import { InvitesPage } from './pages/invitesPage';
import { FavoritesPage } from './pages/favoritesPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';

function App() {
  return (
    <Router>

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

      </Routes>
    </Router>
  );
}

export default App;