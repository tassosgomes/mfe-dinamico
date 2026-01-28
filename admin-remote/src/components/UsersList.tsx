const mockUsers = [
  { id: '1', name: 'Ana Admin', email: 'ana@corp.com', role: 'ADMIN', status: 'active' },
  { id: '2', name: 'Carlos Sales', email: 'carlos@corp.com', role: 'SALES', status: 'active' },
  { id: '3', name: 'Joao User', email: 'joao@corp.com', role: 'USER', status: 'active' },
];

export function UsersList() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Nome</th>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Email</th>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Role</th>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {mockUsers.map((user) => (
          <tr key={user.id}>
            <td style={{ padding: '8px 0' }}>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{user.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
