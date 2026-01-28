import { createRoot } from 'react-dom/client';
import type { AuthContext } from '@mfe/shared';
import AdminApp from './App';

const mockAuthContext: AuthContext = {
  user: {
    sub: 'admin-123',
    name: 'Ana Admin',
    email: 'ana@corp.com',
    preferred_username: 'ana.admin',
    roles: ['ADMIN'],
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  getAccessToken: async () => 'mock-token',
  getIdToken: () => null,
  login: async () => {},
  logout: async () => {},
  refreshTokens: async () => {},
  onAuthEvent: () => () => {},
  emitAuthEvent: () => {},
};

createRoot(document.getElementById('root')!).render(
  <AdminApp authContext={mockAuthContext} basename="/" />
);
