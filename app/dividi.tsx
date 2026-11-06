import { useEffect, useRef, useState } from 'react';
import { Home, Users, User as UserIcon, Split, X, LoaderCircle } from 'lucide-react';
import type { Data, Expense, Group, SavedData, User } from './model';
import { example } from './model';
import { request, sendJson } from './api';
import { Avatar } from './ui';
import AuthForm from './auth-form';
import GroupsScreen from './groups-screen';
import GroupScreen from './group-screen';
import ProfileScreen from './profile-screen';
import GroupForm from './group-form';
import ExpenseForm from './expense-form';
import ExpenseDetails from './expense-details';

type Page = 'home' | 'groups' | 'group' | 'profile';
type Modal = 'group' | 'expense' | 'detail' | null;
type Props = {
  user: User | null;
  onAuthenticated: (user: User) => void;
  onLogout: () => Promise<void>;
};

export default function Dividi({ user, onAuthenticated, onLogout }: Props) {
  // Aqui ficam apenas a navegação e os dados compartilhados entre as telas.
  const [data, setData] = useState<Data>({ groups: [], name: 'Você' });
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(Boolean(user));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState<Page>('home');
  const [selectedGroupId, setSelectedGroupId] = useState('example');
  const [groupTab, setGroupTab] = useState<'expenses' | 'settlement'>('expenses');
  const [demo, setDemo] = useState<Group>(example);
  const [modal, setModal] = useState<Modal>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const saving = useRef(false);

  const isDemo = selectedGroupId === 'example';
  const group = isDemo ? demo : data.groups.find((group) => group.id === selectedGroupId) || demo;

  async function load() {
    setLoading(true);
    setError('');
    try {
      const saved = await request<SavedData>('/api/data');
      setData(saved.data);
      setVersion(saved.version);
      if (saved.data.groups.length) setSelectedGroupId(saved.data.groups[0].id);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) void load();
  }, [user?.email]);
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal();
      dialog.current?.querySelector<HTMLInputElement>('input')?.focus();
    } else {
      dialog.current?.close();
    }
  }, [modal]);

  async function save(next: Data) {
    if (saving.current) return false;
    if (!user) {
      setError('Entre com sua conta para salvar seus grupos.');
      return false;
    }

    saving.current = true;
    setBusy(true);
    setError('');
    try {
      const saved = await sendJson<SavedData>('/api/data', 'PUT', { data: next, version });
      setData(saved.data);
      setVersion(saved.version);
      setNotice('Alterações salvas.');
      return true;
    } catch (error) {
      setError((error as Error).message);
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  async function updateGroup(next: Group) {
    if (isDemo) {
      setDemo(next);
      setNotice('Exemplo atualizado. Seus grupos reais não foram alterados.');
      return true;
    }
    return save({
      ...data,
      groups: data.groups.map((group) => (group.id === next.id ? next : group)),
    });
  }

  function navigate(nextPage: Page) {
    setPage(nextPage);
    setError('');
    setNotice('');
  }
  function openGroup(groupId: string) {
    setSelectedGroupId(groupId);
    navigate('group');
    setGroupTab('expenses');
  }
  function openGroupForm() {
    setError('');
    setModal('group');
  }
  function openExpense(expense: Expense | null = null) {
    setEditing(expense);
    setReviewing(false);
    setError('');
    setModal('expense');
  }

  async function createGroup(group: Group) {
    if (await save({ ...data, groups: [...data.groups, group] })) {
      openGroup(group.id);
      setModal(null);
    }
  }

  async function saveExpense(expense: Expense) {
    const expenses = editing
      ? group.expenses.map((current) => (current.id === editing.id ? expense : current))
      : [...group.expenses, expense];
    if (await updateGroup({ ...group, expenses })) {
      setModal(null);
      setPage('group');
      setGroupTab('expenses');
    }
  }

  async function saveName(name: string) {
    const groups = data.groups.map((group) => ({
      ...group,
      people: group.people.map((person, index) => (index === 0 ? { ...person, name } : person)),
    }));
    if (await save({ ...data, name, groups })) setNotice('Perfil atualizado.');
  }

  async function logout() {
    setBusy(true);
    try {
      await onLogout();
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
    }
  }

  async function deleteExpense() {
    if (!editing || !confirm('Excluir esta despesa? Os saldos serão recalculados.')) return;
    if (
      await updateGroup({
        ...group,
        expenses: group.expenses.filter((expense) => expense.id !== editing.id),
      })
    )
      setModal(null);
  }

  const modalTitle =
    modal === 'group'
      ? 'Criar grupo'
      : modal === 'detail'
        ? 'Detalhes da despesa'
        : reviewing
          ? 'Confira a divisão'
          : editing
            ? 'Editar despesa'
            : 'Nova despesa';

  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            navigate('home');
          }}
        >
          <span className="logo">
            <Split />
          </span>
          Dividi<span className="web-label">WEB</span>
        </a>
        <p className="nav-caption">SUAS CONTAS, EM ORDEM</p>
        <nav>
          {(
            [
              ['home', 'Início', Home],
              ['groups', 'Grupos', Users],
              ['profile', 'Perfil', UserIcon],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id || (id === 'groups' && page === 'group') ? 'active' : ''}
              onClick={() => navigate(id)}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-tip">
          <Split size={25} />
          <strong>
            Mais momentos.
            <br />
            Menos contas.
          </strong>
          <p>Registre os gastos. O Dividi cuida do acerto.</p>
        </div>
        <div className="sidebar-account">
          <Avatar name={data.name} />
          <div>
            <strong>{user ? data.name : 'Visitante'}</strong>
            <small>{user ? 'Minha conta' : 'Modo de exemplo'}</small>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>Despesas compartilhadas</span>
          <div className="row">
            <span className="private-tag">{user ? 'Conta pessoal' : 'Experimente o Dividi'}</span>
            <button
              className="avatar-button"
              aria-label="Abrir perfil"
              onClick={() => navigate('profile')}
            >
              <Avatar name={data.name} />
            </button>
          </div>
        </header>
        <div className="content">
          {error && !modal && (
            <div role="alert" className="alert error">
              {error} {!loading && <button onClick={() => void load()}>Recarregar</button>}
            </div>
          )}
          {notice && !modal && (
            <div className="alert success" role="status">
              {notice}
              <button aria-label="Fechar aviso" onClick={() => setNotice('')}>
                <X size={18} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading">
              <LoaderCircle className="spin" />
              Carregando seus grupos…
            </div>
          ) : (
            <>
              {(page === 'home' || page === 'groups') && (
                <GroupsScreen
                  page={page}
                  data={data}
                  user={user}
                  busy={busy}
                  demo={demo}
                  onCreateGroup={openGroupForm}
                  onOpenGroup={openGroup}
                  onViewGroups={() => navigate('groups')}
                />
              )}
              {page === 'group' && (
                <GroupScreen
                  group={group}
                  isDemo={isDemo}
                  tab={groupTab}
                  busy={busy}
                  onTabChange={setGroupTab}
                  onBack={() => navigate('groups')}
                  onCreateGroup={openGroupForm}
                  onAddExpense={() => openExpense()}
                  onShowExpense={(expense) => {
                    setEditing(expense);
                    setModal('detail');
                  }}
                  onUpdateGroup={updateGroup}
                />
              )}
              {page === 'profile' && (
                <ProfileScreen
                  name={data.name}
                  user={user}
                  busy={busy}
                  onSaveName={saveName}
                  onAuthenticated={onAuthenticated}
                  onLogout={logout}
                />
              )}
            </>
          )}
          <footer>
            Dividi <span>·</span> Boas contas. Bons momentos.
          </footer>
        </div>
      </main>
      <dialog
        ref={dialog}
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setModal(null);
        }}
        onClose={() => {
          if (!busy) setModal(null);
        }}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">
              {modal === 'group' ? 'COMECE POR AQUI' : group.name.toUpperCase()}
            </p>
            <h2>{modalTitle}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Fechar janela"
            disabled={busy}
            onClick={() => setModal(null)}
          >
            <X />
          </button>
        </div>
        {error && (
          <div role="alert" className="alert error">
            {error}
          </div>
        )}
        {modal === 'group' &&
          (user ? (
            <GroupForm name={data.name} busy={busy} onSave={createGroup} onError={setError} />
          ) : (
            <div className="sign-in">
              <p>Entre com sua conta para criar grupos e guardar as despesas.</p>
              <AuthForm onAuthenticated={onAuthenticated} />
            </div>
          ))}
        {modal === 'expense' && (
          <ExpenseForm
            key={editing?.id || 'new'}
            group={group}
            expense={editing}
            busy={busy}
            onSave={saveExpense}
            onError={setError}
            onReviewChange={setReviewing}
          />
        )}
        {modal === 'detail' && editing && (
          <ExpenseDetails
            group={group}
            expense={editing}
            busy={busy}
            onEdit={() => openExpense(editing)}
            onDelete={deleteExpense}
          />
        )}
      </dialog>
    </div>
  );
}
