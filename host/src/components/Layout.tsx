import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { LoadingSpinner } from './LoadingSpinner';
import { useManifestContext } from '../contexts/ManifestContext';
import { buildManifestErrorMessage } from '../utils/errors';

export function Layout() {
  const { isLoading, error, reload } = useManifestContext();

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-content">
          {error && (
            <div className="alert error">
              <strong>Manifesto indisponível</strong>
              <p>{buildManifestErrorMessage(error)}</p>
              <button onClick={() => void reload()}>Tentar novamente</button>
            </div>
          )}
          {isLoading && <LoadingSpinner label="Carregando manifesto..." />}
          {!isLoading && !error && <Outlet />}
        </main>
      </div>
    </div>
  );
}
