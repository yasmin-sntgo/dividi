import { Pencil, Trash2 } from 'lucide-react';
import type { Expense, Group } from './model';
import { money } from './model';
import { Avatar } from './ui';
type Props = {
  expense: Expense;
  group: Group;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};
export default function ExpenseDetails({ expense, group, busy, onEdit, onDelete }: Props) {
  const person = (id: string) =>
    group.people.find((person) => person.id === id)?.name || 'Participante';
  return (
    <>
      <div className="review-total">
        <h3>{expense.title}</h3>
        <strong>{money(expense.cents)}</strong>
        <p>
          {person(expense.payer)} pagou · {expense.date.split('-').reverse().join('/')}
        </p>
      </div>
      <h3>Parte de cada pessoa</h3>
      {Object.entries(expense.shares).map(([id, n]) => (
        <div className="balance-row" key={id}>
          <Avatar name={person(id)} />
          <strong className="grow">{person(id)}</strong>
          <strong>{money(n)}</strong>
        </div>
      ))}
      <div className="row modal-actions">
        <button className="outline grow" disabled={busy} onClick={onEdit}>
          <Pencil size={18} />
          Editar
        </button>
        <button className="danger" disabled={busy} onClick={() => void onDelete()}>
          <Trash2 size={18} />
          Excluir
        </button>
      </div>
    </>
  );
}
