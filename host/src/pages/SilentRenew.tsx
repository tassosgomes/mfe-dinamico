import { useEffect, useState } from 'react';
import { userManager } from '../auth/userManager';

export function SilentRenew() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renew = async () => {
      try {
        await userManager.signinSilentCallback();
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Erro no silent renew';
          setError(message);
        }
      }
    };

    void renew();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <p>Renovando sessão...</p>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
    </div>
  );
}
