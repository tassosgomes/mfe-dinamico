import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManager } from '../auth/userManager';

export function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        await userManager.signinRedirectCallback();
        if (isMounted) {
          navigate('/', { replace: true });
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Erro no callback';
          setError(message);
        }
      }
    };

    void handleCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Processando login...</h1>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
    </div>
  );
}
