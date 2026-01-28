import { Navigate, Route, Routes } from 'react-router-dom';
import { Callback } from './pages/Callback';
import { Login } from './pages/Login';
import { SilentRenew } from './pages/SilentRenew';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthContext } from './contexts/AuthContext';

function Home() {
  const { user, logout } = useAuthContext();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Host Application</h1>
      <p>Usuário autenticado:</p>
      <pre style={{ background: '#111827', color: '#f9fafb', padding: '1rem' }}>
        {JSON.stringify(user, null, 2)}
      </pre>
      <button onClick={() => void logout()} style={{ marginTop: '1rem' }}>
        Sair
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/silent-renew" element={<SilentRenew />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
