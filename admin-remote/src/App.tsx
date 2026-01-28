import type { RemoteAppProps } from '@mfe/shared';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RoleGuard } from './guards/RoleGuard';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';

export default function AdminApp({ authContext, basename }: RemoteAppProps) {
  return (
    <RoleGuard authContext={authContext} requiredRoles={['ADMIN']}>
      <BrowserRouter basename={basename}>
        <ErrorBoundary>
          <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
            <Routes>
              <Route index element={<Dashboard authContext={authContext} />} />
              <Route path="users" element={<Users authContext={authContext} />} />
              <Route path="settings" element={<Settings />} />
            </Routes>
          </div>
        </ErrorBoundary>
      </BrowserRouter>
    </RoleGuard>
  );
}
