/** Idade mínima para usar o app (política de privacidade, seção 9). */
export const MIN_AGE_YEARS = 18;

/**
 * Idade completa em anos para uma data `AAAA-MM-DD`, comparando só dia, mês e
 * ano no calendário local — sem fuso, para o aniversário não "mudar de dia".
 * Devolve null se a data não for válida.
 */
export function ageInYears(birthIsoDate: string, today: Date = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthIsoDate);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) return null;

  let age = today.getFullYear() - year;
  const beforeBirthday =
    today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

export function isAdult(birthIsoDate: string, today: Date = new Date()): boolean {
  const age = ageInYears(birthIsoDate, today);
  return age !== null && age >= MIN_AGE_YEARS;
}
