import type { AuthContext } from '@mfe/shared';
import { UsersList } from '../components/UsersList';

type UsersProps = {
  authContext: AuthContext;
};

export function Users({ authContext }: UsersProps) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <header>
        <h1>Usuarios do Sistema</h1>
        <p>Gestao de contas e permissoes.</p>
      </header>
      <UsersList />
      <small>Usuario atual: {authContext.user?.email ?? 'admin@corp.com'}</small>
    </div>
  );
}
