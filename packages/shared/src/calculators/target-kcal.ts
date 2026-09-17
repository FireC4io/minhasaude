import type { Goal } from './types';

// Déficit de 500kcal/dia é a faixa conservadora recomendada pelo CDC para
// perda de ~0.5kg/semana (500-1000kcal/dia -> 0.5-1kg/semana). Superávit de
// 300kcal/dia fica dentro da faixa 200-500kcal recomendada pela literatura de
// hipertrofia para minimizar ganho de gordura (Iraki et al., "Nutrition
// Recommendations for Bodybuilders in the Off-Season", Sports, 2019).
const GOAL_KCAL_ADJUSTMENT: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export function applyGoalAdjustment(tdeeKcal: number, goal: Goal): number {
  return tdeeKcal + GOAL_KCAL_ADJUSTMENT[goal];
}
