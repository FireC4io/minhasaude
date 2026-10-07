import { MICRONUTRIENTS, type MicronutrientKey, type MicroTotal } from '@minhasaude/shared';
import { appLocale } from '@/i18n/format';

const SPOKEN_UNIT = { g: 'gramas', mg: 'miligramas', mcg: 'microgramas' } as const;

// Casas decimais pelo tamanho: "1.235 mg" e "2,6 mg" leem melhor que "1.234,56".
function decimalsFor(value: number): number {
  return Math.abs(value) >= 10 ? 0 : 1;
}

function formatNumber(value: number): string {
  return value.toLocaleString(appLocale(), { maximumFractionDigits: decimalsFor(value) });
}

/** "2,6 mg"; null vira "sem dado", nunca zero. */
export function formatMicro(key: MicronutrientKey, amount: number | null): string {
  if (amount === null) return 'sem dado';
  return `${formatNumber(amount)} ${MICRONUTRIENTS[key].unit}`;
}

export function spokenMicro(key: MicronutrientKey, amount: number | null): string {
  const { label, unit } = MICRONUTRIENTS[key];
  if (amount === null) return `${label}: sem dado`;
  return `${label}: ${formatNumber(amount)} ${SPOKEN_UNIT[unit]}`;
}

/** Total do dia incompleto: diz de quantos alimentos veio o número. */
export function partialNote(total: MicroTotal): string | null {
  if (total.items === 0 || total.itemsWithData === total.items) return null;
  if (total.itemsWithData === 0) return 'nenhum alimento tem esse dado';
  return `${total.itemsWithData} de ${total.items} alimentos têm esse dado`;
}
