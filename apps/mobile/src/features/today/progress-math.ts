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
  if (!target) return 'Calcule sua meta no Perfil para ver quanto falta';

  const difference = Math.round(target - consumed);
  if (difference > 0) return `Faltam ${difference} kcal`;
  if (difference < 0) return `${-difference} kcal acima da meta`;
  return 'Meta do dia atingida';
}

export function macroValue(mode: MacroDisplayMode, consumed: number, target: number | null): string {
  const consumedG = Math.round(consumed);
  if (!target) return `${consumedG} g`;

  const targetG = Math.round(target);
  switch (mode) {
    case 'remaining': {
      const left = targetG - consumedG;
      return left >= 0 ? `${left} g restantes` : `${-left} g acima`;
    }
    case 'consumed':
      return `${consumedG} de ${targetG} g`;
    case 'percent':
      return `${Math.round((consumed / target) * 100)}%`;
  }
}
