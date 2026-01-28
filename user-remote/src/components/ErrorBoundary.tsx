import { Component } from 'react';
import type { ReactNode } from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

type ErrorBoundaryProps = {
  children: ReactNode;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h1>Algo deu errado</h1>
          <p>Ocorreu um erro inesperado ao carregar o modulo de perfil.</p>
          <button type="button" onClick={this.handleReset}>
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
