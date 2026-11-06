import { ChevronRight } from 'lucide-react';
import type { Group } from './model';
import { balances, money } from './model';
import { Avatar, GroupIcon } from './ui';
export default function GroupCards({
  groups,
  onOpen,
}: {
  groups: Group[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="group-grid">
      {groups.map((x) => {
        const n = balances(x)[x.people[0].id];
        return (
          <button
            className="group-card"
            key={x.id}
            onClick={() => {
              onOpen(x.id);
            }}
          >
            <div className="row">
              <GroupIcon category={x.category} />
              <div className="grow">
                <h3>{x.name}</h3>
                <p>
                  {x.people.length} participantes · {x.expenses.length} despesas
                </p>
              </div>
              <ChevronRight size={20} />
            </div>
            <div className="row group-bottom">
              <div className="avatar-stack">
                {x.people.slice(0, 4).map((p, i) => (
                  <Avatar name={p.name} index={i} key={p.id} />
                ))}
              </div>
              <div className="right">
                <small>{x.id === 'example' ? 'Saldo de João · exemplo' : 'Seu saldo'}</small>
                <strong className={n > 0 ? 'green' : n < 0 ? 'coral' : 'muted'}>
                  {n === 0 ? 'Em dia' : money(n)}
                </strong>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
