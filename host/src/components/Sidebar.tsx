import { NavLink } from 'react-router-dom';
import { useManifestContext } from '../contexts/ManifestContext';

const iconMap: Record<string, string> = {
  shield: '🛡️',
  chart: '📊',
  user: '👤',
};

export function Sidebar() {
  const { manifest, isLoading } = useManifestContext();

  return (
    <aside className="app-sidebar">
      <h2>Menu</h2>
      {isLoading && <p className="sidebar-status">Carregando menu...</p>}
      <nav>
        <ul>
          {manifest?.remotes.map((remote) => (
            <li key={remote.remoteName}>
              <NavLink
                to={remote.routePath}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                <span className="menu-icon">{iconMap[remote.icon] ?? '📦'}</span>
                {remote.navigationLabel}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
