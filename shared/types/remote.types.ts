import { ComponentType } from 'react';
import { AuthContext } from './auth.types';

/**
 * Props necessárias para carregar um remote.
 */
export interface RemoteLoaderProps {
  remoteName: string;
  moduleName: string;
  routePath: string;
  fallback?: ComponentType;
  errorComponent?: ComponentType;
}

/**
 * Contrato do loader de remotes.
 */
export interface RemoteModuleLoader {
  load: (props: RemoteLoaderProps) => Promise<ComponentType>;
  retry: (props: RemoteLoaderProps) => Promise<ComponentType>;
  preload: (remoteName: string) => Promise<void>;
}

/**
 * Informações de um remote carregado.
 */
export interface LoadedRemote {
  component: ComponentType;
  loadTime: number;
  timestamp: number;
}

/**
 * Props que os remotes recebem do Host.
 */
export interface RemoteAppProps {
  authContext: AuthContext;
  basename: string;
}
