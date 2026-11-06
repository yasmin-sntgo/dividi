import { Plus, Wallet, ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react';
import type { Data, Group, User } from './model';
import { balances, money } from './model';
import { GroupIcon } from './ui';
import GroupCards from './group-cards';
type Props = {
  page: 'home' | 'groups';
  data: Data;
  user: User | null;
  busy: boolean;
  demo: Group;
  onCreateGroup: () => void;
  onOpenGroup: (id: string) => void;
  onViewGroups: () => void;
};
export default function GroupsScreen({
  page,
  data,
  user,
  busy,
  demo,
  onCreateGroup,
  onOpenGroup,
  onViewGroups,
}: Props) {
  const groups = data.groups;
  const ownTotals = groups.reduce(
    (totals, group) => {
      const balance = balances(group)[group.people[0].id];
      return {
        receive: totals.receive + Math.max(balance, 0),
        owe: totals.owe + Math.max(-balance, 0),
      };
    },
    { receive: 0, owe: 0 },
  );
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">
            {page === 'home'
              ? 'UM POUCO DE ORGANIZAÇÃO, MUITA TRANQUILIDADE'
              : 'JUNTOS, SEM CONFUSÃO'}
          </p>
          <h1>
            {page === 'home'
              ? user
                ? 'Olá, ' + data.name + '!'
                : 'Dividir ficou mais fácil.'
              : 'Seus grupos'}
          </h1>
          <p>
            {page === 'home'
              ? 'Tudo o que você pagou, deve ou tem a receber, em um só lugar.'
              : `${groups.length} ${groups.length === 1 ? 'grupo criado' : 'grupos criados'}`}
          </p>
        </div>
        <button className="primary" disabled={busy} onClick={onCreateGroup}>
          <Plus size={20} />
          Criar grupo
        </button>
      </div>
      {page === 'home' && (
        <div className="summary-grid">
          <div className="summary">
            <span className="status-icon coral-bg">
              <ArrowUpRight />
            </span>
            <p>Você tem a pagar</p>
            <strong className="coral">{money(ownTotals.owe)}</strong>
            <small>Nos seus grupos</small>
          </div>
          <div className="summary">
            <span className="status-icon green-bg">
              <ArrowDownLeft />
            </span>
            <p>Você tem a receber</p>
            <strong className="green">{money(ownTotals.receive)}</strong>
            <small>Nos seus grupos</small>
          </div>
          <div className="summary blue">
            <Wallet />
            <p>Despesas registradas</p>
            <strong>
              {money(groups.reduce((a, x) => a + x.expenses.reduce((a, e) => a + e.cents, 0), 0))}
            </strong>
            <small>
              {groups.reduce((a, x) => a + x.expenses.length, 0)} despesas · {groups.length} grupos
            </small>
          </div>
        </div>
      )}
      <div className="section-title">
        <h2>{page === 'home' ? 'Seus grupos recentes' : 'Todos os grupos'}</h2>
        {page === 'home' && groups.length > 0 && (
          <button className="text-button" onClick={onViewGroups}>
            Ver todos
          </button>
        )}
      </div>
      {groups.length ? (
        <GroupCards
          groups={page === 'home' ? groups.slice(-3).reverse() : groups}
          onOpen={onOpenGroup}
        />
      ) : (
        <div className="empty">
          <span className="group-icon">
            <Users />
          </span>
          <div>
            <h3>A primeira conta começa com um grupo.</h3>
            <p>Crie um grupo para uma viagem, sua casa ou um encontro com amigos.</p>
          </div>
          <button className="outline" onClick={onCreateGroup}>
            Criar meu primeiro grupo
          </button>
        </div>
      )}
      {groups.length === 0 && (
        <section className="example-section">
          <div className="section-title">
            <h2>Veja como funciona</h2>
            <span className="pill">DADOS DE EXEMPLO</span>
          </div>
          {<GroupCards groups={[demo]} onOpen={onOpenGroup} />}
          <div className="how">
            <span>
              01 <strong>Registre quem pagou</strong>
            </span>
            <span>
              02 <strong>Escolha quem participou</strong>
            </span>
            <span>
              03 <strong>Consulte o acerto</strong>
            </span>
          </div>
        </section>
      )}
    </>
  );
}
