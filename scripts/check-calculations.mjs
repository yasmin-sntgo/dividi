import assert from 'node:assert/strict';
import { balances, transfers, equal, cents, example } from '../app/model.ts';
assert.deepEqual(balances(example), { joao: 51250, ana: -8750, maria: -13750, pedro: -28750 });
assert.equal(
  Object.values(equal(10001, ['a', 'b', 'c'])).reduce((a, b) => a + b, 0),
  10001,
);
assert.ok(
  Object.values(
    balances({
      ...example,
      payments: transfers(example).map((p, i) => ({ ...p, id: String(i), date: '2026-10-01' })),
    }),
  ).every((n) => n === 0),
);
assert.equal(cents('1.150,99'), 115099);
assert.throws(() => cents('-2'));
assert.throws(() => cents('0,001'));
const custom = {
  ...example,
  expenses: [
    {
      id: 'x',
      title: 'Jantar',
      cents: 10000,
      payer: 'pedro',
      shares: { joao: 2000, ana: 8000 },
      date: '2026-10-01',
    },
  ],
  payments: [],
};
assert.deepEqual(balances(custom), { joao: -2000, ana: -8000, maria: 0, pedro: 10000 });
assert.equal(
  Object.values(
    balances({
      ...custom,
      payments: [{ id: 'p', from: 'ana', to: 'pedro', cents: 4000, date: '2026-10-01' }],
    }),
  ).reduce((a, b) => a + b, 0),
  0,
);
console.log(
  'Cálculos corretos: saldos, centavos, acertos, divisão personalizada, pagador fora da divisão e valores inválidos.',
);
