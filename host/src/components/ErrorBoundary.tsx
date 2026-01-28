import { Component } from 'react';
import { resolveErrorMessage } from '../utils/errors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className="error-boundary">
          <h2>Falha ao carregar o módulo</h2>
          <p>{resolveErrorMessage(error)}</p>
        </div>
      );
    }

    return children;
  }
}
