import type { RemoteAppProps } from '@mfe/shared';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RoleGuard } from './guards/RoleGuard';
import { Dashboard } from './pages/Dashboard';

export default function AdminApp({ authContext, basename }: RemoteAppProps) {
  return (
    <RoleGuard authContext={authContext} requiredRoles={['ADMIN']}>
      <ErrorBoundary>
        <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
          <Dashboard authContext={authContext} />
        </div>
      </ErrorBoundary>
    </RoleGuard>
  );
}
