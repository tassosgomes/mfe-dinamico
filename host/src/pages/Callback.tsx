import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManager } from '../auth/userManager';

export function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  // Ref para evitar dupla execução em StrictMode
  const callbackExecuted = useRef(false);

  useEffect(() => {
    // StrictMode executa useEffect duas vezes em dev - proteger contra isso
    if (callbackExecuted.current) {
      return;
    }
    callbackExecuted.current = true;

    const handleCallback = async () => {
      try {
        await userManager.signinRedirectCallback();
        navigate('/', { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro no callback';
        setError(message);
      }
    };

    void handleCallback();
  }, [navigate]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Processando login...</h1>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
    </div>
  );
}
