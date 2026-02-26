import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login } from './pages/login';
import { URL_API, URL_API_TESTE } from './utility/url_apis';

function App() {


  return (
    <>

      <Router>

        <Routes>
          <Route path='/' element={<Login />}></Route>
        </Routes>

      </Router>
    </>
  )
}

export default App
