import { GraduationCap, House, Umbrella, Users } from 'lucide-react';

export function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return <span className={'avatar tone' + (index % 4)}>{initials}</span>;
}

export function GroupIcon({ category }: { category: string }) {
  const Icon =
    category === 'Viagem'
      ? Umbrella
      : category === 'Casa'
        ? House
        : category === 'Estudos'
          ? GraduationCap
          : Users;
  return (
    <span className="group-icon">
      <Icon size={24} />
    </span>
  );
}
