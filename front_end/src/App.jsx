// front_end\src\App.jsx
import './styles/Global.css';
import './styles/Shared.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login } from './pages/login';
import { Cadastro } from './pages/cadastro';
import { Home } from './pages/home';
import { UserPage } from './pages/user';
import { Studio } from './pages/studio';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>

      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/cadastro' element={<Cadastro />} />

        <Route path='/home' element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />


        <Route path='/usuario' element={
          <ProtectedRoute>
            <UserPage />
          </ProtectedRoute>
        } />


        <Route path='/studio/:id' element={
          <ProtectedRoute>
            <Studio />
          </ProtectedRoute>
        } />

      </Routes>
    </Router>
  );
}

export default App;