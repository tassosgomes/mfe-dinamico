import type { RemoteAppProps } from '@mfe/shared';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EditProfile } from './pages/EditProfile';
import { Profile } from './pages/Profile';

export default function UserApp({ authContext, basename }: RemoteAppProps) {
  return (
    <BrowserRouter basename={basename}>
      <ErrorBoundary>
        <div
          style={{
            minHeight: '100vh',
            padding: 24,
            background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 45%)',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <Routes>
            <Route index element={<Profile authContext={authContext} />} />
            <Route path="edit" element={<EditProfile authContext={authContext} />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
