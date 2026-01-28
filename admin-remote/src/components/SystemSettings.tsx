import { useState } from 'react';

type SettingsState = {
  sessionTimeout: string;
  allowSelfSignup: boolean;
  auditLevel: 'low' | 'medium' | 'high';
};

export function SystemSettings() {
  const [settings, setSettings] = useState<SettingsState>({
    sessionTimeout: '30',
    allowSelfSignup: false,
    auditLevel: 'medium',
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      style={{ display: 'grid', gap: 12, maxWidth: 320 }}
    >
      <label style={{ display: 'grid', gap: 4 }}>
        Tempo de sessao (min)
        <input
          type="number"
          min={5}
          value={settings.sessionTimeout}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              sessionTimeout: event.target.value,
            }))
          }
        />
      </label>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={settings.allowSelfSignup}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              allowSelfSignup: event.target.checked,
            }))
          }
        />
        Permitir auto cadastro
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        Nivel de auditoria
        <select
          value={settings.auditLevel}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              auditLevel: event.target.value as SettingsState['auditLevel'],
            }))
          }
        >
          <option value="low">Baixo</option>
          <option value="medium">Medio</option>
          <option value="high">Alto</option>
        </select>
      </label>

      <button type="submit">Salvar configuracoes</button>
    </form>
  );
}
