import { useState } from 'react';
import { LogOut } from 'lucide-react';
import type { User } from './model';
import { Avatar } from './ui';
import AuthForm from './auth-form';
type Props = {
  name: string;
  user: User | null;
  busy: boolean;
  onSaveName: (name: string) => Promise<void>;
  onAuthenticated: (user: User) => void;
  onLogout: () => Promise<void>;
};
export default function ProfileScreen({
  name,
  user,
  busy,
  onSaveName,
  onAuthenticated,
  onLogout,
}: Props) {
  const [profileName, setProfileName] = useState(name);
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">DO SEU JEITO</p>
          <h1>Meu perfil</h1>
          <p>Sua conta e informações sobre o Dividi.</p>
        </div>
      </div>
      <div className="profile-card">
        <Avatar name={name} />
        <h2>{user ? name : 'Bem-vindo ao Dividi'}</h2>
        <p>{user?.email || 'Entre para salvar e consultar seus grupos em outros dispositivos.'}</p>
        {user ? (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await onSaveName(profileName.trim());
            }}
          >
            <label>
              Como você quer ser chamado?
              <input
                maxLength={60}
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </label>
            <button className="primary" disabled={busy || !profileName.trim()}>
              Salvar nome
            </button>
          </form>
        ) : (
          <AuthForm onAuthenticated={onAuthenticated} />
        )}
      </div>
      <div className="profile-info">
        <h3>Seu Dividi</h3>
        <p>
          Seus grupos ficam vinculados à sua conta. Os participantes são cadastrados por nome; esta
          versão permite que você organize as despesas por eles.
        </p>
        <p>O acerto é uma sugestão de transferências. Nenhum pagamento é feito pelo site.</p>
        {user && (
          <button className="logout" disabled={busy} onClick={() => void onLogout()}>
            <LogOut size={18} />
            Sair da conta
          </button>
        )}
      </div>
    </>
  );
}
