import type { AuthContext } from '@mfe/shared';
import { Link } from 'react-router-dom';

type ReportsProps = {
  authContext: AuthContext;
};

const reports = [
  {
    title: 'Relatorio Regional',
    summary: 'Comparativo de performance por regiao e ticket medio.',
    status: 'Atualizado hoje',
  },
  {
    title: 'Forecast Trimestral',
    summary: 'Projecao baseada em pipeline e sazonalidade.',
    status: 'Atualizado ontem',
  },
  {
    title: 'Ciclo de Vendas',
    summary: 'Tempo medio por etapa do funil e gargalos.',
    status: 'Atualizado ha 3 dias',
  },
];

export function Reports({ authContext }: ReportsProps) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <header style={{ display: 'grid', gap: 4 }}>
        <h1 style={{ margin: 0 }}>Relatorios Detalhados</h1>
        <p style={{ margin: 0, color: '#555' }}>
          Analises preparadas para {authContext.user?.name ?? 'equipe de vendas'}
        </p>
      </header>

      <section style={{ display: 'grid', gap: 12 }}>
        {reports.map((report) => (
          <article
            key={report.title}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 12,
              padding: 16,
              background: '#fff',
              display: 'grid',
              gap: 6,
            }}
          >
            <strong>{report.title}</strong>
            <p style={{ margin: 0, color: '#555' }}>{report.summary}</p>
            <span style={{ fontSize: 12, color: '#777' }}>{report.status}</span>
          </article>
        ))}
      </section>

      <nav>
        <Link to="/">Voltar para o dashboard</Link>
      </nav>
    </div>
  );
}
