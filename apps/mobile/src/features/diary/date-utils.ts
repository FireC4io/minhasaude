export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysToIsoDate(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function formatIsoDateLabel(date: string): string {
  const today = todayIsoDate();
  if (date === today) return 'Hoje';
  if (date === addDaysToIsoDate(today, -1)) return 'Ontem';
  if (date === addDaysToIsoDate(today, 1)) return 'Amanhã';

  const parsed = new Date(`${date}T00:00:00Z`);
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' });
}
