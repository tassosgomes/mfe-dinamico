import { REMOTES_CONFIG } from '../config/remotes.config';
import type { RemoteConfigEntry, Role } from '../types';

export class ManifestService {
  getAuthorizedRemotes(userRoles: Role[]): RemoteConfigEntry[] {
    return REMOTES_CONFIG.filter((remote) => {
      if (!remote.enabled) return false;
      if (remote.requiredRoles.length === 0) return true;
      return remote.requiredRoles.some((role) => userRoles.includes(role));
    });
  }

  getAllRemotes(): RemoteConfigEntry[] {
    return [...REMOTES_CONFIG];
  }

  userHasAccessToRemote(requiredRoles: Role[], userRoles: Role[]): boolean {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
