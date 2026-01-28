import type { AuthContext } from '@mfe/shared';
import { Link } from 'react-router-dom';

type DashboardProps = {
  authContext: AuthContext;
};

const stats = [
  { label: 'Usuarios Ativos', value: '42' },
  { label: 'Sessoes Hoje', value: '128' },
  { label: 'Erros de Sistema', value: '3' },
];

export function Dashboard({ authContext }: DashboardProps) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <header>
        <h1>Dashboard Administrativo</h1>
        <p>Bem-vindo, {authContext.user?.name ?? 'Admin'}</p>
      </header>

      <section style={{ display: 'grid', gap: 12 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}
          >
            <strong>{stat.label}</strong>
            <div style={{ fontSize: 24 }}>{stat.value}</div>
          </div>
        ))}
      </section>

      <nav style={{ display: 'flex', gap: 12 }}>
        <Link to="users">Gerenciar Usuarios</Link>
        <Link to="settings">Configuracoes</Link>
      </nav>
    </div>
  );
}
