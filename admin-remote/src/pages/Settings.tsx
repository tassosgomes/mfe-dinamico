import { SystemSettings } from '../components/SystemSettings';

export function Settings() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <header>
        <h1>Configuracoes do Sistema</h1>
        <p>Controle parametros globais do ambiente.</p>
      </header>
      <SystemSettings />
    </div>
  );
}
