import { createRoot } from 'react-dom/client';
import type { AuthContext } from '@mfe/shared';
import SalesApp from './App';

const mockAuthContext: AuthContext = {
  user: {
    sub: 'sales-123',
    name: 'Carlos Sales',
    email: 'carlos@corp.com',
    preferred_username: 'carlos.sales',
    roles: ['SALES'],
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
  <SalesApp authContext={mockAuthContext} basename="/" />
);
