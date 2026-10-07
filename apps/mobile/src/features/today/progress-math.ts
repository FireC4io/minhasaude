import i18n from 'i18next';

/**
 * Textos e frações dos cards da tela Hoje. Informativos (RDC 657/2022): dizem
 * o número, nunca o que a pessoa "deveria" fazer.
 */

export type MacroDisplayMode = 'remaining' | 'consumed' | 'percent';

export function progressFraction(consumed: number, target: number | null): number {
  if (!target || target <= 0) return 0;
  return Math.min(1, Math.max(0, consumed / target));
}

export function caloriesStatus(consumed: number, target: number | null): string {
  if (!target) return i18n.t('today.noGoal');

  const difference = Math.round(target - consumed);
  if (difference > 0) return i18n.t('today.left', { kcal: difference });
  if (difference < 0) return i18n.t('today.over', { kcal: -difference });
  return i18n.t('today.reached');
}

export function macroValue(mode: MacroDisplayMode, consumed: number, target: number | null): string {
  const consumedG = Math.round(consumed);
  if (!target) return `${consumedG} g`;

  const targetG = Math.round(target);
  switch (mode) {
    case 'remaining': {
      const left = targetG - consumedG;
      return left >= 0 ? i18n.t('today.gramsLeft', { grams: left }) : i18n.t('today.gramsOver', { grams: -left });
    }
    case 'consumed':
      return i18n.t('today.gramsOf', { consumed: consumedG, target: targetG });
    case 'percent':
      return `${Math.round((consumed / target) * 100)}%`;
  }
}
