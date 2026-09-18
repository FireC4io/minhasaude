import { ACTIVITY_LEVELS, GOALS, SEXES } from '@minhasaude/shared';

export const SEX_LABELS: Record<(typeof SEXES)[number], string> = {
  male: 'Masculino',
  female: 'Feminino',
};

export const ACTIVITY_LEVEL_LABELS: Record<(typeof ACTIVITY_LEVELS)[number], string> = {
  sedentary: 'Sedentário',
  light: 'Levemente ativo',
  moderate: 'Moderadamente ativo',
  active: 'Ativo',
  very_active: 'Muito ativo',
};

export const GOAL_LABELS: Record<(typeof GOALS)[number], string> = {
  lose: 'Emagrecer',
  maintain: 'Manter o peso',
  gain: 'Ganhar peso',
};
