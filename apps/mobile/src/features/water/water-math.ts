import { appLocale } from '@/i18n/format';

export const GLASS_ML = 250;

/** Atalhos de registro (F4-35): copo, garrafa pequena, garrafa de 1 litro. */
export const WATER_SHORTCUTS_ML = [250, 500, 1000] as const;

/**
 * Meta inicial ajustável pela pessoa. Não é "recomendação": o app não calcula
 * nem sugere quanto beber (RDC 657/2022) — só mostra o que a pessoa escolheu.
 */
export const DEFAULT_WATER_GOAL_ML = 2000;

// Função, não constante: o idioma pode mudar com o app aberto.
const numberFormat = () => new Intl.NumberFormat(appLocale(), { maximumFractionDigits: 2 });

export function formatMl(ml: number): string {
  return ml >= 1000 ? `${numberFormat().format(ml / 1000)} L` : `${Math.round(ml)} ml`;
}

export function glassesFilled(totalMl: number, glassesDrawn: number): number {
  return Math.min(glassesDrawn, Math.floor(totalMl / GLASS_ML));
}

export function spokenWater(totalMl: number, goalMl: number): string {
  return `Água: ${numberFormat().format(totalMl)} mililitros de ${numberFormat().format(goalMl)} mililitros.`;
}
