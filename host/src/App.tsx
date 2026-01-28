import { Route, Routes } from 'react-router-dom';
import { Callback } from './pages/Callback';
import { Login } from './pages/Login';
import { SilentRenew } from './pages/SilentRenew';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AccessDenied } from './pages/AccessDenied';
import { NotFound } from './pages/NotFound';
import { useManifestContext } from './contexts/ManifestContext';
import { DynamicRemoteLoader } from './loaders/DynamicRemoteLoader';

export default function App() {
  const { manifest } = useManifestContext();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/silent-renew" element={<SilentRenew />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        {manifest?.remotes.map((remote) => (
          <Route
            key={remote.remoteName}
            path={`${remote.routePath}/*`}
            element={
              <DynamicRemoteLoader
                remoteName={remote.remoteName}
                remoteEntry={remote.remoteEntry}
                moduleName={remote.exposedModule}
                routePath={remote.routePath}
              />
            }
          />
        ))}
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
