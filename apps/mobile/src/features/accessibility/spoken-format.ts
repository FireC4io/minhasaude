/**
 * Números e datas no formato em que o leitor de tela deve falar.
 *
 * O texto visual usa abreviações ("130g", "128 kcal", "12 de set.") que o
 * TalkBack/VoiceOver leem mal ou soletram. Os rótulos de acessibilidade usam
 * estas funções para dizer a unidade por extenso, com vírgula decimal pt-BR.
 */

function formatNumber(value: number, maximumFractionDigits: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits });
}

// Norma culta: singular de 0 (exclusive) até 2 (exclusive) — "1,5 quilo",
// "0,5 grama" —, plural no zero e de 2 em diante.
function withUnit(value: number, formatted: string, singular: string, plural: string): string {
  const isSingular = value !== 0 && Math.abs(value) < 2;
  return `${formatted} ${isSingular ? singular : plural}`;
}

export function spokenKcal(value: number): string {
  const rounded = Math.round(value);
  return withUnit(rounded, formatNumber(rounded, 0), 'quilocaloria', 'quilocalorias');
}

export function spokenGrams(value: number): string {
  return withUnit(value, formatNumber(value, 1), 'grama', 'gramas');
}

export function spokenKg(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return withUnit(rounded, formatNumber(rounded, 1), 'quilo', 'quilos');
}

export function spokenDate(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
