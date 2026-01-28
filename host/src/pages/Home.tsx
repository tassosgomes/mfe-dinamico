import { useAuthContext } from '../contexts/AuthContext';

export function Home() {
  const { user } = useAuthContext();

  return (
    <section className="page">
      <h1>Bem-vindo!</h1>
      <p>Selecione um módulo no menu para começar.</p>
      {user && (
        <div className="card">
          <h2>Perfil</h2>
          <p>
            <strong>{user.name}</strong>
          </p>
          <p>{user.email}</p>
          <p>Roles: {user.roles.join(', ') || 'Nenhuma'}</p>
        </div>
      )}
    </section>
  );
}
