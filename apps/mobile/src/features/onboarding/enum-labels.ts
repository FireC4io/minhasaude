import { ACTIVITY_LEVELS, GOALS, SEXES } from '@minhasaude/shared';

import { translatedLabels } from '@/i18n/labels';

export const SEX_LABELS: Record<(typeof SEXES)[number], string> = translatedLabels({
  male: 'labels.sex.male',
  female: 'labels.sex.female',
});

export const ACTIVITY_LEVEL_LABELS: Record<(typeof ACTIVITY_LEVELS)[number], string> =
  translatedLabels({
    sedentary: 'labels.activity.sedentary',
    light: 'labels.activity.light',
    moderate: 'labels.activity.moderate',
    active: 'labels.activity.active',
    very_active: 'labels.activity.very_active',
  });

export const GOAL_LABELS: Record<(typeof GOALS)[number], string> = translatedLabels({
  lose: 'labels.goal.lose',
  maintain: 'labels.goal.maintain',
  gain: 'labels.goal.gain',
});
