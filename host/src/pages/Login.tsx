import { useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

export function Login() {
  const { login, isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated) {
      window.location.replace('/');
    }
  }, [isAuthenticated]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Login</h1>
      <p>Entre com suas credenciais do Keycloak.</p>
      <button onClick={() => void login()} disabled={isLoading}>
        {isLoading ? 'Carregando...' : 'Entrar'}
      </button>
    </div>
  );
}
