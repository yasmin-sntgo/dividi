import {
  Plus,
  Info,
  Wallet,
  Receipt,
  Split,
  ChevronRight,
  CheckCheck,
  Check,
  Users,
} from 'lucide-react';
import type { Expense, Group } from './model';
import { balances, transfers, money } from './model';
import { Avatar } from './ui';
type Props = {
  group: Group;
  isDemo: boolean;
  tab: 'expenses' | 'settlement';
  busy: boolean;
  onTabChange: (tab: 'expenses' | 'settlement') => void;
  onBack: () => void;
  onCreateGroup: () => void;
  onAddExpense: () => void;
  onShowExpense: (expense: Expense) => void;
  onUpdateGroup: (group: Group) => Promise<boolean>;
};
export default function GroupScreen({
  group,
  isDemo,
  tab,
  busy,
  onTabChange,
  onBack,
  onCreateGroup,
  onAddExpense,
  onShowExpense,
  onUpdateGroup,
}: Props) {
  const groupBalances = balances(group);
  const pendingTransfers = transfers(group);
  const personName = (id: string) =>
    group.people.find((person) => person.id === id)?.name || 'Participante';
  return (
    <>
      <button className="text-button back" onClick={onBack}>
        Voltar para grupos
      </button>
      <div className="heading">
        <div>
          <div className="row">
            <p className="eyebrow">{group.category.toUpperCase()}</p>
            {isDemo && <span className="pill">EXEMPLO INTERATIVO</span>}
          </div>
          <h1>{group.name}</h1>
          <p>{group.people.map((p) => p.name).join(', ')}</p>
        </div>
        <button className="primary" disabled={busy} onClick={onAddExpense}>
          <Plus size={20} />
          Adicionar despesa
        </button>
      </div>
      {isDemo && (
        <div className="alert info">
          <Info size={18} />
          Você está testando um exemplo. Crie seu grupo para guardar suas contas.
          <button onClick={onCreateGroup}>Criar grupo</button>
        </div>
      )}
      <div className="group-layout">
        <div className="group-main">
          <div className="group-total">
            <div>
              <p>Total de despesas</p>
              <strong>{money(group.expenses.reduce((n, e) => n + e.cents, 0))}</strong>
              <small>{group.expenses.length} despesas registradas</small>
            </div>
            <Wallet size={36} />
          </div>
          <div className="tabs">
            <button
              className={tab === 'expenses' ? 'selected' : ''}
              onClick={() => onTabChange('expenses')}
            >
              <Receipt size={18} />
              Despesas
            </button>
            <button
              className={tab === 'settlement' ? 'selected' : ''}
              onClick={() => onTabChange('settlement')}
            >
              <Split size={18} />
              Acerto do grupo<span>{pendingTransfers.length}</span>
            </button>
          </div>
          {tab === 'expenses' ? (
            <>
              <div className="section-title">
                <h2>Histórico de despesas</h2>
                <small>{group.expenses.length} registros</small>
              </div>
              <div className="expense-list">
                {!group.expenses.length && (
                  <div className="empty">
                    <p>Nenhuma despesa ainda. Registre o primeiro gasto do grupo.</p>
                  </div>
                )}
                {[...group.expenses].reverse().map((e) => (
                  <button
                    className="expense-row"
                    key={e.id}
                    onClick={() => {
                      onShowExpense(e);
                    }}
                  >
                    <span className="group-icon">
                      <Receipt size={22} />
                    </span>
                    <div className="grow">
                      <h3>{e.title}</h3>
                      <p>
                        {personName(e.payer)} pagou · {Object.keys(e.shares).length} pessoas
                      </p>
                      <small>{e.date.split('-').reverse().join('/')}</small>
                    </div>
                    <strong>{money(e.cents)}</strong>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="settlement-banner">
                <span className="pill">
                  <CheckCheck size={15} />
                  ACERTO SIMPLIFICADO
                </span>
                <h2>{pendingTransfers.length ? 'Quem paga quem?' : 'Tudo em dia!'}</h2>
                <p>
                  {pendingTransfers.length
                    ? 'Estes pagamentos zeram os saldos atuais do grupo.'
                    : 'Não há pagamentos pendentes neste grupo.'}
                </p>
              </div>
              <p className="muted payment-help">
                Marque somente depois de realizar a transferência. O Dividi registra o acerto, sem
                movimentar dinheiro.
              </p>
              <div className="expense-list">
                {pendingTransfers.map((t) => (
                  <div className="transfer" key={t.from + t.to}>
                    <Avatar
                      name={personName(t.from)}
                      index={group.people.findIndex((p) => p.id === t.from)}
                    />
                    <div className="grow">
                      <strong>
                        {personName(t.from)} paga a {personName(t.to)}
                      </strong>
                      <small>Acerto pendente</small>
                    </div>
                    <strong className="blue-text">{money(t.cents)}</strong>
                    <button
                      className="outline"
                      disabled={busy}
                      onClick={() =>
                        void onUpdateGroup({
                          ...group,
                          payments: [
                            ...group.payments,
                            { ...t, id: crypto.randomUUID(), date: new Date().toISOString() },
                          ],
                        })
                      }
                    >
                      <Check size={17} />
                      Registrar pago
                    </button>
                  </div>
                ))}
              </div>
              {group.payments.length > 0 && (
                <>
                  <div className="section-title">
                    <h2>Acertos registrados</h2>
                  </div>
                  {[...group.payments].reverse().map((p) => (
                    <div className="paid-row" key={p.id}>
                      <CheckCheck size={18} />
                      <div className="grow">
                        <strong>
                          {personName(p.from)} pagou a {personName(p.to)}
                        </strong>
                        <small>{new Date(p.date).toLocaleDateString('pt-BR')}</small>
                      </div>
                      <strong>{money(p.cents)}</strong>
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() =>
                          void onUpdateGroup({
                            ...group,
                            payments: group.payments.filter((x) => x.id !== p.id),
                          })
                        }
                      >
                        Desfazer
                      </button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
        <aside className="balance-panel">
          <div className="section-title">
            <h2>Saldos do grupo</h2>
            <Users size={20} />
          </div>
          <p className="muted">O que cada pessoa tem a pagar ou receber.</p>
          {group.people.map((p, i) => (
            <div className="balance-row" key={p.id}>
              <Avatar name={p.name} index={i} />
              <div className="grow">
                <strong>{p.name}</strong>
                <small>
                  {groupBalances[p.id] > 0
                    ? 'A receber'
                    : groupBalances[p.id] < 0
                      ? 'A pagar'
                      : 'Em dia'}
                </small>
              </div>
              <strong
                className={
                  groupBalances[p.id] > 0 ? 'green' : groupBalances[p.id] < 0 ? 'coral' : 'muted'
                }
              >
                {money(Math.abs(groupBalances[p.id]))}
              </strong>
            </div>
          ))}
          <div className="balance-note">
            <Info size={17} />
            <span>Saldo = valor pago menos sua parte nas despesas, considerando os acertos.</span>
          </div>
          <button
            className="outline full"
            onClick={() => onTabChange(tab === 'expenses' ? 'settlement' : 'expenses')}
          >
            {tab === 'expenses' ? 'Ver acerto do grupo' : 'Ver despesas'}
          </button>
        </aside>
      </div>
    </>
  );
}
