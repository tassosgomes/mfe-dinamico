import { useAuthContext } from '../contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuthContext();

  return (
    <header className="app-header">
      <div>
        <strong>GestAuto MFE</strong>
        <span className="app-header-subtitle">RBAC POC</span>
      </div>
      <div className="app-header-user">
        <div>
          <div className="user-name">{user?.name ?? 'Usuário'}</div>
          <div className="user-email">{user?.email ?? ''}</div>
        </div>
        <button onClick={() => void logout()}>Sair</button>
      </div>
    </header>
  );
}
