import { useState } from 'react';
import type { Group } from './model';

type Props = {
  name: string;
  busy: boolean;
  onSave: (group: Group) => Promise<void>;
  onError: (message: string) => void;
};

export default function GroupForm({ name, busy, onSave, onError }: Props) {
  const [groupName, setGroupName] = useState('');
  const [category, setCategory] = useState('Viagem');
  const [participants, setParticipants] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const others = participants
      .split(/[,\n]/)
      .map((value) => value.trim())
      .filter(Boolean);
    const names = [name, ...others];

    if (!groupName.trim() || others.length === 0) {
      onError('Informe o nome do grupo e pelo menos mais um participante.');
      return;
    }

    if (
      names.length > 30 ||
      new Set(names.map((value) => value.toLowerCase())).size !== names.length
    ) {
      onError('Use nomes diferentes para os participantes, até 30 pessoas.');
      return;
    }

    await onSave({
      id: crypto.randomUUID(),
      name: groupName.trim(),
      category,
      people: names.map((name) => ({ id: crypto.randomUUID(), name })),
      expenses: [],
      payments: [],
    });
  }

  return (
    <form onSubmit={submit}>
      <label>
        Nome do grupo
        <input
          required
          maxLength={80}
          placeholder="Ex.: Viagem para a praia"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
        />
      </label>
      <label>
        Tipo de grupo
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {['Viagem', 'Casa', 'Amigos', 'Estudos', 'Outro'].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label>
        Outros participantes
        <textarea
          required
          placeholder="Ana, Maria, Pedro"
          value={participants}
          onChange={(event) => setParticipants(event.target.value)}
        />
      </label>
      <p className="muted">Separe os nomes por vírgulas. Você ({name}) já faz parte do grupo.</p>
      <button className="primary full" disabled={busy}>
        {busy ? 'Salvando…' : 'Criar grupo'}
      </button>
    </form>
  );
}
