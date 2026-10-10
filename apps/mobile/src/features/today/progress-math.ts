import i18n from 'i18next';

import { spokenGrams, spokenKcal } from '@/features/accessibility/spoken-format';

/**
 * Textos e frações dos cards da tela Hoje. Informativos (RDC 657/2022): dizem
 * o número, nunca o que a pessoa "deveria" fazer.
 */

export type MacroDisplayMode = 'remaining' | 'consumed' | 'percent';

/** Na tela vai a sigla ("886 kcal"); para o leitor de tela, a unidade por extenso. */
export type UnitStyle = 'visual' | 'spoken';

const kcalText = (kcal: number, style: UnitStyle): string =>
  style === 'spoken' ? spokenKcal(kcal) : `${kcal} kcal`;

const gramsText = (grams: number, style: UnitStyle): string =>
  style === 'spoken' ? spokenGrams(grams) : `${grams} g`;

export function progressFraction(consumed: number, target: number | null): number {
  if (!target || target <= 0) return 0;
  return Math.min(1, Math.max(0, consumed / target));
}

export function caloriesStatus(
  consumed: number,
  target: number | null,
  style: UnitStyle = 'visual',
): string {
  if (!target) return i18n.t('today.noGoal');

  const difference = Math.round(target - consumed);
  if (difference > 0) return i18n.t('today.left', { kcal: kcalText(difference, style) });
  if (difference < 0) return i18n.t('today.over', { kcal: kcalText(-difference, style) });
  return i18n.t('today.reached');
}

export function macroValue(
  mode: MacroDisplayMode,
  consumed: number,
  target: number | null,
  style: UnitStyle = 'visual',
): string {
  const consumedG = Math.round(consumed);
  if (!target) return gramsText(consumedG, style);

  const targetG = Math.round(target);
  switch (mode) {
    case 'remaining': {
      const left = targetG - consumedG;
      return left >= 0
        ? i18n.t('today.gramsLeft', { grams: gramsText(left, style) })
        : i18n.t('today.gramsOver', { grams: gramsText(-left, style) });
    }
    case 'consumed':
      return i18n.t('today.gramsOf', { consumed: consumedG, target: gramsText(targetG, style) });
    case 'percent':
      return `${Math.round((consumed / target) * 100)}%`;
  }
}
