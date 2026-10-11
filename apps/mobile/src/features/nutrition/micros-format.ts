import { MICRONUTRIENTS, type MicronutrientKey, type MicroTotal } from '@minhasaude/shared';
import { t } from 'i18next';
import { appLocale } from '@/i18n/format';


// Casas decimais pelo tamanho: "1.235 mg" e "2,6 mg" leem melhor que "1.234,56".
function decimalsFor(value: number): number {
  return Math.abs(value) >= 10 ? 0 : 1;
}

function formatNumber(value: number): string {
  return value.toLocaleString(appLocale(), { maximumFractionDigits: decimalsFor(value) });
}

/** "2,6 mg"; null vira "sem dado", nunca zero. */
export function formatMicro(key: MicronutrientKey, amount: number | null): string {
  if (amount === null) return t('micros.noData');
  return `${formatNumber(amount)} ${MICRONUTRIENTS[key].unit}`;
}

export function spokenMicro(key: MicronutrientKey, amount: number | null): string {
  const label = t(`micros.names.${key}`);
  if (amount === null) return `${label}: ${t('micros.noData')}`;
  return `${label}: ${formatNumber(amount)} ${t(`micros.spokenUnits.${MICRONUTRIENTS[key].unit}`)}`;
}

/** Total do dia incompleto: diz de quantos alimentos veio o número. */
export function partialNote(total: MicroTotal): string | null {
  if (total.items === 0 || total.itemsWithData === total.items) return null;
  if (total.itemsWithData === 0) return t('micros.noneHave');
  return t('micros.someHave', { with: total.itemsWithData, total: total.items });
}
