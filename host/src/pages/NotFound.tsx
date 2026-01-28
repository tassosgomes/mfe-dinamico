import { Link, useLocation } from 'react-router-dom';
import { useManifestContext } from '../contexts/ManifestContext';
import { KNOWN_REMOTE_ROUTES } from '../config/remoteRoutes';

export function NotFound() {
  const location = useLocation();
  const { manifest } = useManifestContext();

  const isKnownRemoteRoute = KNOWN_REMOTE_ROUTES.some((route) =>
    location.pathname.startsWith(route)
  );
  const isAuthorizedRoute = manifest?.remotes.some((remote) =>
    location.pathname.startsWith(remote.routePath)
  );

  if (isKnownRemoteRoute && !isAuthorizedRoute) {
    return (
      <section className="page">
        <h1>Acesso negado</h1>
        <p>Você não possui permissão para acessar este módulo.</p>
        <Link to="/">Voltar para o início</Link>
      </section>
    );
  }

  return (
    <section className="page">
      <h1>Página não encontrada</h1>
      <p>A rota solicitada não existe.</p>
      <Link to="/">Voltar para o início</Link>
    </section>
  );
}
