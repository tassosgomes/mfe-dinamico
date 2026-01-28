import { Link } from 'react-router-dom';

export function AccessDenied() {
  return (
    <section className="page">
      <h1>Acesso negado</h1>
      <p>Você não possui permissão para acessar este módulo.</p>
      <Link to="/">Voltar para o início</Link>
    </section>
  );
}
