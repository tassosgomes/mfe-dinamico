const mockRanking = [
  { position: 1, name: 'Maria Silva', sales: 45000, deals: 12 },
  { position: 2, name: 'Pedro Santos', sales: 38000, deals: 10 },
  { position: 3, name: 'Ana Costa', sales: 32000, deals: 8 },
  { position: 4, name: 'Lucas Oliveira', sales: 28000, deals: 7 },
  { position: 5, name: 'Julia Ferreira', sales: 25000, deals: 6 },
];

const highlightColors = ['#ffe6cc', '#f5f5f5', '#e6f0ff'];

export function RankingTable() {
  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h3 style={{ margin: 0 }}>Ranking de Vendedores</h3>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <thead style={{ background: '#f2f4f8' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: 12 }}>#</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Vendedor</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Vendas (R$)</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Negocios</th>
            </tr>
          </thead>
          <tbody>
            {mockRanking.map((seller, index) => (
              <tr
                key={seller.position}
                style={{
                  background: seller.position <= 3 ? highlightColors[index] : 'transparent',
                  borderTop: '1px solid #eee',
                }}
              >
                <td style={{ padding: 12 }}>
                  <strong>{seller.position}</strong>
                </td>
                <td style={{ padding: 12 }}>{seller.name}</td>
                <td style={{ padding: 12 }}>
                  R$ {seller.sales.toLocaleString()}
                </td>
                <td style={{ padding: 12 }}>{seller.deals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
