import type { AuthContext } from '@mfe/shared';
import { Link } from 'react-router-dom';
import { RankingTable } from '../components/RankingTable';
import { SalesChart } from '../components/SalesChart';

type DashboardProps = {
  authContext: AuthContext;
};

const highlights = [
  { label: 'Meta Mensal', value: 'R$ 200.000' },
  { label: 'Pipeline Ativo', value: 'R$ 540.000' },
  { label: 'Taxa de Conversao', value: '18%' },
];

export function Dashboard({ authContext }: DashboardProps) {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <header style={{ display: 'grid', gap: 4 }}>
        <h1 style={{ margin: 0 }}>Dashboard de Vendas</h1>
        <p style={{ margin: 0, color: '#555' }}>
          Bem-vindo, {authContext.user?.name ?? 'time de vendas'}
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        }}
      >
        {highlights.map((item) => (
          <div
            key={item.label}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 12,
              padding: 12,
              background: '#fff',
            }}
          >
            <strong style={{ color: '#555' }}>{item.label}</strong>
            <div style={{ fontSize: 20, marginTop: 6 }}>{item.value}</div>
          </div>
        ))}
      </section>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <div
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 16,
            padding: 16,
            background: '#fff',
          }}
        >
          <SalesChart />
        </div>
        <div
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 16,
            padding: 16,
            background: '#fff',
          }}
        >
          <RankingTable />
        </div>
      </div>

      <nav>
        <Link to="reports">Ver relatorios detalhados</Link>
      </nav>
    </div>
  );
}
