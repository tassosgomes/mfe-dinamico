import type { UserProfile } from '@mfe/shared';
import type { CSSProperties } from 'react';

type UserInfoProps = {
  user: UserProfile;
};

const avatarStyle: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  background: '#1f2937',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: 20,
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  color: '#6b7280',
};

export function UserInfo({ user }: UserInfoProps) {
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={avatarStyle}>{initials || 'U'}</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{user.name}</div>
          <div style={{ color: '#6b7280' }}>{user.email}</div>
        </div>
      </div>

      <dl style={{ display: 'grid', gap: 12, margin: 0 }}>
        <div>
          <dt style={labelStyle}>Nome de usuario</dt>
          <dd style={{ margin: 0, fontWeight: 500 }}>
            {user.preferred_username}
          </dd>
        </div>
        <div>
          <dt style={labelStyle}>ID do usuario</dt>
          <dd style={{ margin: 0, fontFamily: 'monospace' }}>{user.sub}</dd>
        </div>
        <div>
          <dt style={labelStyle}>Permissoes</dt>
          <dd style={{ margin: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {user.roles.length === 0 ? (
              <span style={{ color: '#6b7280' }}>Sem roles</span>
            ) : (
              user.roles.map((role) => (
                <span
                  key={role}
                  style={{
                    background: '#eef2ff',
                    color: '#3730a3',
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {role}
                </span>
              ))
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
