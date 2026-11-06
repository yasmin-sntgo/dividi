import { z } from 'zod';
const amount = z.number().int().min(0).max(100000000);
const group = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(80),
    category: z.enum(['Viagem', 'Casa', 'Amigos', 'Estudos', 'Outro']),
    people: z
      .array(z.object({ id: z.string().min(1).max(100), name: z.string().trim().min(1).max(60) }))
      .min(2)
      .max(30),
    expenses: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          title: z.string().trim().min(1).max(100),
          cents: amount.refine((n) => n > 0),
          payer: z.string(),
          shares: z.record(amount),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        }),
      )
      .max(2000),
    payments: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          from: z.string(),
          to: z.string(),
          cents: amount.refine((n) => n > 0),
          date: z.string().max(40),
        }),
      )
      .max(2000),
  })
  .superRefine((g, c) => {
    const ids = new Set(g.people.map((p) => p.id));
    if (ids.size !== g.people.length)
      c.addIssue({ code: 'custom', message: 'Participantes duplicados.' });
    for (const e of g.expenses)
      if (
        !ids.has(e.payer) ||
        !Object.keys(e.shares).length ||
        Object.keys(e.shares).some((id) => !ids.has(id)) ||
        Object.values(e.shares).reduce((a, b) => a + b, 0) !== e.cents
      )
        c.addIssue({ code: 'custom', message: 'A divisão deve corresponder ao valor total.' });
    for (const p of g.payments)
      if (p.from === p.to || !ids.has(p.from) || !ids.has(p.to))
        c.addIssue({ code: 'custom', message: 'Acerto inválido.' });
    for (const list of [g.expenses, g.payments])
      if (new Set(list.map((x) => x.id)).size !== list.length)
        c.addIssue({ code: 'custom', message: 'Registros duplicados.' });
  });
export const payloadSchema = z
  .object({
    version: z.number().int().min(0),
    data: z.object({ name: z.string().trim().min(1).max(60), groups: z.array(group).max(100) }),
  })
  .superRefine((v, c) => {
    if (new Set(v.data.groups.map((g) => g.id)).size !== v.data.groups.length)
      c.addIssue({ code: 'custom', message: 'Grupos duplicados.' });
  });
