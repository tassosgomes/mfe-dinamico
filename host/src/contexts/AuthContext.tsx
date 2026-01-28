import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AuthContext as AuthContextType,
  AuthEvent,
  AuthEventHandler,
  AuthEventType,
  AuthTokens,
  UserProfile,
} from '@mfe/shared';
import type { User } from 'oidc-client-ts';
import { authEventBus } from '../utils/EventBus';
import { userManager } from '../auth/userManager';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContextProvider = createContext<AuthContextType | undefined>(undefined);
const authEventTypes: AuthEventType[] = [
  'login',
  'logout',
  'token_refreshed',
  'access_denied',
  'error',
];

function buildTokens(oidcUser: User): AuthTokens {
  return {
    id_token: oidcUser.id_token ?? '',
    access_token: oidcUser.access_token ?? '',
    refresh_token: oidcUser.refresh_token ?? '',
    expires_at: oidcUser.expires_at ? oidcUser.expires_at * 1000 : Date.now(),
  };
}

function extractUserProfile(oidcUser: User): UserProfile {
  const profile = oidcUser.profile;
  const roles = (profile as { realm_access?: { roles?: string[] } })?.realm_access
    ?.roles;

  return {
    sub: profile.sub ?? '',
    name: profile.name ?? '',
    email: profile.email ?? '',
    preferred_username: profile.preferred_username ?? '',
    roles: (roles ?? []).filter((role) =>
      ['ADMIN', 'SALES', 'USER'].includes(role)
    ) as UserProfile['roles'],
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tokensRef = useRef<AuthTokens | null>(null);
  const hasSessionRef = useRef(false);

  const emitAuthEvent = useCallback((event: AuthEvent) => {
    authEventBus.emit(event);
  }, []);

  const syncUserState = useCallback(
    (oidcUser: User, eventType: AuthEventType) => {
      const profile = extractUserProfile(oidcUser);
      tokensRef.current = buildTokens(oidcUser);
      setUser(profile);
      setError(null);
      setIsLoading(false);
      emitAuthEvent({ type: eventType, timestamp: Date.now(), data: profile });
    },
    [emitAuthEvent]
  );

  const refreshTokens = useCallback(async () => {
    try {
      const refreshedUser = await userManager.signinSilent();
      if (refreshedUser) {
        syncUserState(refreshedUser, 'token_refreshed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao renovar token';
      setError(message);
      emitAuthEvent({ type: 'error', timestamp: Date.now(), data: message });
    }
  }, [emitAuthEvent, syncUserState]);

  const login = useCallback(async () => {
    await userManager.signinRedirect();
  }, []);

  const logout = useCallback(async () => {
    await userManager.removeUser();
    setUser(null);
    tokensRef.current = null;
    emitAuthEvent({ type: 'logout', timestamp: Date.now() });
    await userManager.signoutRedirect();
  }, [emitAuthEvent]);

  const getAccessToken = useCallback(async () => {
    const currentUser = await userManager.getUser();
    if (!currentUser) {
      const message = 'Usuário não autenticado';
      setError(message);
      emitAuthEvent({ type: 'access_denied', timestamp: Date.now() });
      throw new Error(message);
    }

    if (currentUser.expired) {
      await refreshTokens();
    }

    const refreshedUser = await userManager.getUser();
    return refreshedUser?.access_token ?? '';
  }, [emitAuthEvent, refreshTokens]);

  const getIdToken = useCallback(() => {
    return tokensRef.current?.id_token ?? null;
  }, []);

  const onAuthEvent = useCallback((handler: AuthEventHandler) => {
    const unsubscribers = authEventTypes.map((eventType) =>
      authEventBus.subscribe(eventType, handler)
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleUserLoaded = (loadedUser: User) => {
      const eventType = hasSessionRef.current ? 'token_refreshed' : 'login';
      hasSessionRef.current = true;
      syncUserState(loadedUser, eventType);
    };

    const handleUserUnloaded = () => {
      hasSessionRef.current = false;
      setUser(null);
      tokensRef.current = null;
      emitAuthEvent({ type: 'logout', timestamp: Date.now() });
      setIsLoading(false);
    };

    const handleSilentRenewError = (err: Error) => {
      setError(err.message);
      emitAuthEvent({ type: 'error', timestamp: Date.now(), data: err.message });
    };

    const initialize = async () => {
      try {
        const currentUser = await userManager.getUser();
        if (currentUser && isMounted) {
          hasSessionRef.current = true;
          syncUserState(currentUser, 'login');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar usuário';
        setError(message);
        emitAuthEvent({ type: 'error', timestamp: Date.now(), data: message });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    userManager.events.addUserLoaded(handleUserLoaded);
    userManager.events.addUserUnloaded(handleUserUnloaded);
    userManager.events.addAccessTokenExpiring(refreshTokens);
    userManager.events.addSilentRenewError(handleSilentRenewError);

    void initialize();

    return () => {
      isMounted = false;
      userManager.events.removeUserLoaded(handleUserLoaded);
      userManager.events.removeUserUnloaded(handleUserUnloaded);
      userManager.events.removeAccessTokenExpiring(refreshTokens);
      userManager.events.removeSilentRenewError(handleSilentRenewError);
    };
  }, [emitAuthEvent, refreshTokens, syncUserState]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      getAccessToken,
      getIdToken,
      login,
      logout,
      refreshTokens,
      onAuthEvent,
      emitAuthEvent,
    }),
    [
      user,
      isLoading,
      error,
      getAccessToken,
      getIdToken,
      login,
      logout,
      refreshTokens,
      onAuthEvent,
      emitAuthEvent,
    ]
  );

  return (
    <AuthContextProvider.Provider value={contextValue}>
      {children}
    </AuthContextProvider.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContextProvider);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider');
  }
  return context;
}
