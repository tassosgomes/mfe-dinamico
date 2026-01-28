import type { AuthContext } from '@mfe/shared';
import { Link } from 'react-router-dom';
import { UserInfo } from '../components/UserInfo';

type ProfileProps = {
  authContext: AuthContext;
};

export function Profile({ authContext }: ProfileProps) {
  const { user } = authContext;

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <header>
        <h1 style={{ marginBottom: 4 }}>Meu Perfil</h1>
        <p style={{ color: '#6b7280' }}>
          Aqui estao suas informacoes pessoais.
        </p>
      </header>

      <UserInfo user={user} />

      <div>
        <Link
          to="edit"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 8,
            background: '#2563eb',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Editar perfil
        </Link>
      </div>
    </div>
  );
}
