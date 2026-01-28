import type { RemoteAppProps } from '@mfe/shared';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Profile } from './pages/Profile';

export default function UserApp({ authContext, basename }: RemoteAppProps) {
  return (
    <ErrorBoundary>
      <div
        style={{
          minHeight: '100vh',
          padding: 24,
          background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 45%)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <Profile authContext={authContext} />
      </div>
    </ErrorBoundary>
  );
}
