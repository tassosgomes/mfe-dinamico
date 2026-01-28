import type { AuthContext, UserProfile } from '@mfe/shared';
import { useNavigate } from 'react-router-dom';
import { ProfileForm } from '../components/ProfileForm';

type EditProfileProps = {
  authContext: AuthContext;
};

export function EditProfile({ authContext }: EditProfileProps) {
  const { user } = authContext;
  const navigate = useNavigate();

  if (!user) {
    return <div>Carregando...</div>;
  }

  const handleSave = (data: Partial<UserProfile>) => {
    console.log('Dados salvos:', data);
    alert('Perfil atualizado com sucesso! (simulado)');
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <header>
        <h1 style={{ marginBottom: 4 }}>Editar Perfil</h1>
        <p style={{ color: '#6b7280' }}>
          Atualize seus dados basicos e salve as mudancas.
        </p>
      </header>

      <ProfileForm user={user} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
