import { useState } from 'react';
import type { FormEvent } from 'react';
import type { UserProfile } from '@mfe/shared';

type ProfileFormProps = {
  user: UserProfile;
  onSave: (data: Partial<UserProfile>) => void;
  onCancel: () => void;
};

export function ProfileForm({ user, onSave, onCancel }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'grid',
        gap: 16,
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div style={{ display: 'grid', gap: 8 }}>
        <label htmlFor="name" style={{ fontWeight: 600 }}>
          Nome completo
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(event) =>
            setFormData({ ...formData, name: event.target.value })
          }
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5f5',
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <label htmlFor="email" style={{ fontWeight: 600 }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(event) =>
            setFormData({ ...formData, email: event.target.value })
          }
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5f5',
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: 8, opacity: 0.8 }}>
        <label style={{ fontWeight: 600 }}>Nome de usuario</label>
        <input
          type="text"
          value={user.preferred_username}
          disabled
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        />
        <small style={{ color: '#6b7280' }}>
          O nome de usuario nao pode ser alterado.
        </small>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #cbd5f5',
            background: '#fff',
            fontWeight: 600,
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          Salvar alteracoes
        </button>
      </div>
    </form>
  );
}
