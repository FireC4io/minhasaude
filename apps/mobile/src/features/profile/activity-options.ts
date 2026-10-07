import { ACTIVITY_LEVELS } from '@minhasaude/shared';

import type { RadioOption } from '@/components/ui/radio-list';
import { ACTIVITY_LEVEL_LABELS } from '@/features/onboarding/enum-labels';
import { translatedLabels } from '@/i18n/labels';

type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

/**
 * Exemplo concreto em cada nível (F4-31): é a escolha que mais confunde e a
 * que mais muda a meta. Os exemplos descrevem rotina, nunca recomendam nada.
 */
const ACTIVITY_LEVEL_EXAMPLES: Record<ActivityLevel, string> = translatedLabels({
  sedentary: 'labels.activityExample.sedentary',
  light: 'labels.activityExample.light',
  moderate: 'labels.activityExample.moderate',
  active: 'labels.activityExample.active',
  very_active: 'labels.activityExample.very_active',
});

export const ACTIVITY_OPTIONS: readonly RadioOption<ActivityLevel>[] = ACTIVITY_LEVELS.map(
  // Getters: o texto é lido na hora de desenhar, no idioma em uso.
  (level) => ({
    value: level,
    get label() {
      return ACTIVITY_LEVEL_LABELS[level];
    },
    get description() {
      return ACTIVITY_LEVEL_EXAMPLES[level];
    },
  }),
);
