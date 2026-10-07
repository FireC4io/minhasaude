/**
 * Datas do diário no formato AAAA-MM-DD, sempre no fuso do aparelho.
 *
 * Usar `toISOString()` aqui é bug: ele converte para UTC, e no Brasil (UTC-3)
 * isso adianta o dia a partir das 21h.
 */

const pad = (value: number): string => String(value).padStart(2, '0');

export function isoDateFromLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIsoDate(now: Date = new Date()): string {
  return isoDateFromLocal(now);
}

/** Meio-dia local do dia: longe da meia-noite, imune a horário de verão. */
export function localDateFromIso(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12);
}

export function addDaysToIsoDate(date: string, days: number): string {
  const parsed = localDateFromIso(date);
  parsed.setDate(parsed.getDate() + days);
  return isoDateFromLocal(parsed);
}

export function formatIsoDateLabel(date: string, now: Date = new Date()): string {
  const today = todayIsoDate(now);
  if (date === today) return 'Hoje';
  if (date === addDaysToIsoDate(today, -1)) return 'Ontem';
  if (date === addDaysToIsoDate(today, 1)) return 'Amanhã';

  return localDateFromIso(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

/** Domingo a sábado da semana que contém `date`. */
export function weekOf(date: string): string[] {
  const sunday = addDaysToIsoDate(date, -localDateFromIso(date).getDay());
  return Array.from({ length: 7 }, (_, index) => addDaysToIsoDate(sunday, index));
}

/** Semanas (domingo a sábado) do mês de `date`; `null` nos dias fora do mês. */
export function monthGrid(date: string): (string | null)[][] {
  const reference = localDateFromIso(date);
  const first = new Date(reference.getFullYear(), reference.getMonth(), 1, 12);
  const daysInMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      isoDateFromLocal(new Date(first.getFullYear(), first.getMonth(), index + 1, 12)),
    ),
  ];
  const trailing = (7 - (cells.length % 7)) % 7;
  const filled = [...cells, ...Array.from({ length: trailing }, () => null)];

  return Array.from({ length: filled.length / 7 }, (_, week) =>
    filled.slice(week * 7, week * 7 + 7),
  );
}
