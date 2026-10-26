import { useNavigate } from 'react-router-dom';
import { useUserData } from '../contexts/UserDataContext';
import { URL_API_TESTE } from '../utility/url_apis';

/** Encerra a sessão no servidor, esquece o usuário em memória e volta ao login sem deixar a tela anterior no histórico. */
function useLogout() {
    const navigate = useNavigate();
    const { clearUsuario } = useUserData();

    return async function logout() {
        try {
            await fetch(`${URL_API_TESTE}/usuario/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch {
            // Sem rede o cookie continua, mas a sessão local é encerrada do mesmo jeito.
        } finally {
            clearUsuario();
            navigate('/', { replace: true });
        }
    };
}

export { useLogout };
