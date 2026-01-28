import type { RemoteAppProps } from '@mfe/shared';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RoleGuard } from './guards/RoleGuard';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';

export default function SalesApp({ authContext, basename }: RemoteAppProps) {
  return (
    <RoleGuard authContext={authContext} requiredRoles={['SALES', 'ADMIN']}>
      <BrowserRouter basename={basename}>
        <ErrorBoundary>
          <div
            style={{
              padding: 24,
              fontFamily: 'Arial, sans-serif',
              background: '#f5f6fa',
              minHeight: '100vh',
            }}
          >
            <Routes>
              <Route index element={<Dashboard authContext={authContext} />} />
              <Route path="reports" element={<Reports authContext={authContext} />} />
            </Routes>
          </div>
        </ErrorBoundary>
      </BrowserRouter>
    </RoleGuard>
  );
}
