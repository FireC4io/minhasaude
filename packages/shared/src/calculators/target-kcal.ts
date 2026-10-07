import type { Goal } from './types';

/**
 * Meta de calorias a partir do ritmo semanal escolhido (F4, aprovado pelo dono
 * em 2026-10-07). Versão 1.0.0 (até 07/10/2026) usava ajuste fixo: −500 kcal
 * para perder e +300 para ganhar, sem escolha de ritmo.
 *
 * ~7700 kcal por kg de peso corporal é a aproximação clássica (Wishnofsky,
 * 1958). Modelos dinâmicos (Hall et al., Lancet 2011, base do NIH Body Weight
 * Planner) mostram que a perda real desacelera com o tempo, então isto é uma
 * estimativa de partida — o texto da tela não promete resultado (RDC 657/2022).
 *
 * Trava de segurança: a meta nunca fica abaixo da TMB (gasto em repouso).
 */
export const TARGET_KCAL_VERSION = '2.0.0';

export const WEEKLY_PACES_KG = [0.25, 0.5, 0.75] as const;
export type WeeklyPaceKg = (typeof WEEKLY_PACES_KG)[number];

/** A opção mais conservadora vem marcada. */
export const DEFAULT_WEEKLY_PACE_KG: WeeklyPaceKg = 0.25;

const KCAL_PER_KG = 7700;
const DAYS_PER_WEEK = 7;

export interface TargetKcalInputs {
  tdeeKcal: number;
  bmrKcal: number;
  goal: Goal;
  /** null = ainda não escolhido (perfis antigos): usa o conservador. */
  weeklyPaceKg: WeeklyPaceKg | null;
}

export interface TargetKcalResult {
  targetKcal: number;
  /** true quando a trava da TMB segurou a meta — a tela explica isso. */
  limitedByBmr: boolean;
}

export function computeTargetKcal({ tdeeKcal, bmrKcal, goal, weeklyPaceKg }: TargetKcalInputs): TargetKcalResult {
  if (goal === 'maintain') return { targetKcal: Math.round(tdeeKcal), limitedByBmr: false };

  const pace = weeklyPaceKg ?? DEFAULT_WEEKLY_PACE_KG;
  const dailyKcal = Math.round((pace * KCAL_PER_KG) / DAYS_PER_WEEK);
  const raw = Math.round(goal === 'lose' ? tdeeKcal - dailyKcal : tdeeKcal + dailyKcal);

  if (raw < bmrKcal) return { targetKcal: Math.round(bmrKcal), limitedByBmr: true };
  return { targetKcal: raw, limitedByBmr: false };
}
