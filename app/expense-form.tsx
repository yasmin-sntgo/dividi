import { useState } from 'react';
import { Check, Info } from 'lucide-react';
import type { Expense, Group } from './model';
import { money, cents, equal } from './model';
import { Avatar } from './ui';
type Props = {
  group: Group;
  expense: Expense | null;
  busy: boolean;
  onSave: (expense: Expense) => Promise<void>;
  onError: (message: string) => void;
  onReviewChange: (reviewing: boolean) => void;
};
const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export default function ExpenseForm({
  group,
  expense,
  busy,
  onSave,
  onError,
  onReviewChange,
}: Props) {
  const [title, setTitle] = useState(expense?.title || '');
  const [amount, setAmount] = useState(
    expense ? (expense.cents / 100).toFixed(2).replace('.', ',') : '',
  );
  const [payer, setPayer] = useState(expense?.payer || group.people[0].id);
  const [participants, setParticipants] = useState(
    expense ? Object.keys(expense.shares) : group.people.map((person) => person.id),
  );
  const [mode, setMode] = useState(expense ? 'custom' : 'equal');
  const [custom, setCustom] = useState<Record<string, string>>(
    expense
      ? Object.fromEntries(
          Object.entries(expense.shares).map(([id, amount]) => [
            id,
            (amount / 100).toFixed(2).replace('.', ','),
          ]),
        )
      : {},
  );
  const [date, setDate] = useState(expense?.date || today());
  const [review, setReview] = useState<Expense | null>(null);
  const person = (id: string) =>
    group.people.find((person) => person.id === id)?.name || 'Participante';
  function prepareExpense(event: React.FormEvent) {
    event.preventDefault();
    try {
      const total = cents(amount);
      if (!title.trim() || !total || !participants.length)
        throw Error('Informe descrição, valor positivo e pelo menos um participante.');
      const shares =
        mode === 'equal'
          ? equal(total, participants)
          : Object.fromEntries(participants.map((id) => [id, cents(custom[id] || '0')]));
      if (Object.values(shares).reduce((sum, amount) => sum + amount, 0) !== total)
        throw Error('Os valores individuais devem somar ' + money(total) + '.');
      setReview({
        id: expense?.id || crypto.randomUUID(),
        title: title.trim(),
        cents: total,
        payer,
        shares,
        date,
      });
      onReviewChange(true);
      onError('');
    } catch (error) {
      onError((error as Error).message);
    }
  }
  return review ? (
    <>
      <div className="review-total">
        <span className="status-icon green-bg">
          <Check />
        </span>
        <h3>{review.title}</h3>
        <p>Valor total</p>
        <strong>{money(review.cents)}</strong>
      </div>
      <h3>Divisão</h3>
      {Object.entries(review.shares).map(([id, n]) => (
        <div className="balance-row" key={id}>
          <Avatar name={person(id)} />
          <strong className="grow">
            {person(id)}
            {id === review.payer && <small>Pagou o total</small>}
          </strong>
          <strong>{money(n)}</strong>
        </div>
      ))}
      <div className="alert info">
        <Info size={18} />
        {person(review.payer)} pagou {money(review.cents)}. A divisão acima será adicionada ao
        grupo.
      </div>
      <div className="row">
        <button
          className="outline"
          disabled={busy}
          onClick={() => {
            setReview(null);
            onReviewChange(false);
          }}
        >
          Revisar dados
        </button>
        <button className="primary grow" disabled={busy} onClick={() => void onSave(review)}>
          {busy ? 'Salvando…' : expense ? 'Salvar alterações' : 'Adicionar ao grupo'}
        </button>
      </div>
    </>
  ) : (
    <form onSubmit={prepareExpense}>
      <label>
        Descrição
        <input
          required
          maxLength={100}
          placeholder="Ex.: Restaurante"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <div className="form-columns">
        <label>
          Valor total (R$)
          <input
            required
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label>
          Data
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <label>
        Quem pagou?
        <select value={payer} onChange={(e) => setPayer(e.target.value)}>
          {group.people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Quem participou?</legend>
        {group.people.map((p, i) => (
          <label className="checkbox-row" key={p.id}>
            <input
              type="checkbox"
              checked={participants.includes(p.id)}
              onChange={(e) =>
                setParticipants(
                  e.target.checked
                    ? [...participants, p.id]
                    : participants.filter((id) => id !== p.id),
                )
              }
            />
            <Avatar name={p.name} index={i} />
            <span>{p.name}</span>
          </label>
        ))}
      </fieldset>
      <label>
        Como dividir?
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="equal">Igualmente</option>
          <option value="custom">Valores diferentes</option>
        </select>
      </label>
      {mode === 'custom' &&
        participants.map((id) => (
          <label className="custom-row" key={id}>
            {person(id)}
            <input
              inputMode="decimal"
              placeholder="0,00"
              value={custom[id] || ''}
              onChange={(e) => setCustom({ ...custom, [id]: e.target.value })}
            />
          </label>
        ))}
      {mode === 'equal' && (
        <p className="muted">
          Centavos restantes são distribuídos entre os participantes para fechar o total.
        </p>
      )}
      <button className="primary full" disabled={busy}>
        Revisar divisão
      </button>
    </form>
  );
}
