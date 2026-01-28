import type { AuthContext, Role } from '@mfe/shared';
import type { ReactNode } from 'react';
import { AccessDenied } from '../components/AccessDenied';

type RoleGuardProps = {
  authContext: AuthContext;
  requiredRoles: Role[];
  children: ReactNode;
};

export function RoleGuard({ authContext, requiredRoles, children }: RoleGuardProps) {
  const userRoles = authContext.user?.roles ?? [];
  const hasAccess = requiredRoles.some((role) => userRoles.includes(role));

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
