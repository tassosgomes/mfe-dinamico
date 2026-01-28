const mockSalesData = [
  { month: 'Jan', value: 12000 },
  { month: 'Fev', value: 15000 },
  { month: 'Mar', value: 18000 },
  { month: 'Abr', value: 14000 },
  { month: 'Mai', value: 22000 },
  { month: 'Jun', value: 19000 },
];

export function SalesChart() {
  const maxValue = Math.max(...mockSalesData.map((data) => data.value));

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <header>
        <h3 style={{ margin: 0 }}>Vendas por Mes</h3>
        <p style={{ margin: 0, color: '#555' }}>
          Total do semestre: R$ {mockSalesData.reduce((sum, data) => sum + data.value, 0).toLocaleString()}
        </p>
      </header>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
          height: 220,
          padding: 12,
          borderRadius: 12,
          border: '1px solid #e0e0e0',
          background: '#f7f7f7',
        }}
      >
        {mockSalesData.map((data) => (
          <div
            key={data.month}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 48,
                height: `${(data.value / maxValue) * 100}%`,
                background: '#2f7fff',
                borderRadius: 6,
                boxShadow: '0 4px 12px rgba(47, 127, 255, 0.25)',
              }}
            />
            <strong style={{ fontSize: 12 }}>{data.month}</strong>
            <span style={{ fontSize: 12, color: '#444' }}>
              R$ {data.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
