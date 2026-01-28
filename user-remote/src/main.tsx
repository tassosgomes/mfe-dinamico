import { createRoot } from 'react-dom/client';
import type { AuthContext } from '@mfe/shared';
import UserApp from './App';

const mockAuthContext: AuthContext = {
  user: {
    sub: 'user-456',
    name: 'Joao Silva',
    email: 'joao@corp.com',
    preferred_username: 'jsilva',
    roles: ['USER'],
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
  <UserApp authContext={mockAuthContext} basename="/" />
);
