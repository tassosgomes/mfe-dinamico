import type { RemoteAppProps } from '@mfe/shared';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RoleGuard } from './guards/RoleGuard';
import { Dashboard } from './pages/Dashboard';

export default function SalesApp({ authContext, basename }: RemoteAppProps) {
  return (
    <RoleGuard authContext={authContext} requiredRoles={['SALES', 'ADMIN']}>
      <ErrorBoundary>
        <div
          style={{
            padding: 24,
            fontFamily: 'Arial, sans-serif',
            background: '#f5f6fa',
            minHeight: '100vh',
          }}
        >
          <Dashboard authContext={authContext} />
        </div>
      </ErrorBoundary>
    </RoleGuard>
  );
}
