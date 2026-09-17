import type { ActivityLevel } from './types';

// Multiplicadores padrão de atividade física (Harris-Benedict/Mifflin),
// referência: fórmula clássica de fator de atividade usada em conjunto com
// TMB para estimar o gasto energético total diário (TDEE).
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateTdee(bmrKcal: number, activityLevel: ActivityLevel): number {
  return bmrKcal * ACTIVITY_MULTIPLIERS[activityLevel];
}
