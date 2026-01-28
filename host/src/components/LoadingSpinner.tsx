interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label = 'Carregando...' }: LoadingSpinnerProps) {
  return (
    <div className="loading-spinner">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
