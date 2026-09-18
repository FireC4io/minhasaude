import type { ActivityLevel, Goal } from '../calculators/types';

// Espelha os enums Postgres de apps/api/src/database/entities/profile.entity.ts —
// a API é a fonte da verdade dos valores em si (colunas enum do banco);
// aqui só derivamos as listas em runtime que faltam pras calculadoras
// (que já exportam ActivityLevel/Goal como tipos, sem os valores).
export const ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
] as const satisfies readonly ActivityLevel[];

export const GOALS = ['lose', 'maintain', 'gain'] as const satisfies readonly Goal[];

export const SEXES = ['male', 'female'] as const;
export type Sex = (typeof SEXES)[number];
