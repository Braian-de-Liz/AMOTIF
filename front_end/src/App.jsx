// front_end\src\App.jsx
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login } from './pages/login';
import { Cadastro } from './pages/cadastro';

function App() {


  return (
    <>

      <Router>

        <Routes>
          <Route path='/' element={<Login />}></Route>
          <Route path='/cadastro' element={<Cadastro/>}></Route>
        </Routes>

      </Router>
    </>
  )
}

export default App
