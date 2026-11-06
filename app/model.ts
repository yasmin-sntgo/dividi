export type User = { name: string; email: string };
export type Person = { id: string; name: string };
export type Expense = {
  id: string;
  title: string;
  cents: number;
  payer: string;
  shares: Record<string, number>;
  date: string;
};
export type Payment = { id: string; from: string; to: string; cents: number; date: string };
export type Group = {
  id: string;
  name: string;
  category: string;
  people: Person[];
  expenses: Expense[];
  payments: Payment[];
};
export type Data = { groups: Group[]; name: string };
export type SavedData = { data: Data; version: number };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const money = (amount: number) => currency.format(amount / 100);

export function cents(value: string) {
  const cleaned = value.trim().replace(/\s|R\$/g, '');
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error('Informe um valor válido, com até duas casas decimais.');
  }

  const amount = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(amount) || amount > 100000000) {
    throw new Error('O valor máximo é R$ 1.000.000,00.');
  }

  return amount;
}

export function equal(total: number, participants: string[]) {
  const share = Math.floor(total / participants.length);
  const remainingCents = total % participants.length;

  // Distribui os centavos restantes para que a soma feche exatamente o total.
  return Object.fromEntries(
    participants.map((id, index) => [id, share + (index < remainingCents ? 1 : 0)]),
  );
}

export function balances(group: Group) {
  const result = Object.fromEntries(group.people.map((person) => [person.id, 0]));

  for (const expense of group.expenses) {
    result[expense.payer] += expense.cents;
    for (const [personId, share] of Object.entries(expense.shares)) {
      result[personId] -= share;
    }
  }

  for (const payment of group.payments) {
    result[payment.from] += payment.cents;
    result[payment.to] -= payment.cents;
  }

  return result;
}

export function transfers(group: Group) {
  const currentBalances = balances(group);
  const debtors = group.people
    .filter((person) => currentBalances[person.id] < 0)
    .map((person) => ({ id: person.id, amount: -currentBalances[person.id] }));
  const creditors = group.people
    .filter((person) => currentBalances[person.id] > 0)
    .map((person) => ({ id: person.id, amount: currentBalances[person.id] }));

  debtors.sort((first, second) => second.amount - first.amount);
  creditors.sort((first, second) => second.amount - first.amount);

  const payments: { from: string; to: string; cents: number }[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  // Combina os saldos sem precisar cruzar cada despesa com todas as outras.
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);

    payments.push({ from: debtor.id, to: creditor.id, cents: amount });
    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) debtorIndex++;
    if (creditor.amount === 0) creditorIndex++;
  }

  return payments;
}

// Dados fictícios, usados apenas no exemplo interativo.
export const example: Group = {
  id: 'example',
  name: 'Viagem para a praia',
  category: 'Viagem',
  people: [
    { id: 'joao', name: 'João' },
    { id: 'ana', name: 'Ana' },
    { id: 'maria', name: 'Maria' },
    { id: 'pedro', name: 'Pedro' },
  ],
  expenses: [
    {
      id: 'hotel',
      title: 'Hotel',
      cents: 80000,
      payer: 'joao',
      shares: equal(80000, ['joao', 'ana', 'maria', 'pedro']),
      date: '2026-10-01',
    },
    {
      id: 'gasolina',
      title: 'Gasolina',
      cents: 20000,
      payer: 'ana',
      shares: equal(20000, ['joao', 'ana', 'maria', 'pedro']),
      date: '2026-10-01',
    },
    {
      id: 'restaurante',
      title: 'Restaurante',
      cents: 15000,
      payer: 'maria',
      shares: equal(15000, ['joao', 'ana', 'maria', 'pedro']),
      date: '2026-10-01',
    },
  ],
  payments: [],
};
