import { ACTIVITY_LEVELS } from '@minhasaude/shared';

import type { RadioOption } from '@/components/ui/radio-list';
import { ACTIVITY_LEVEL_LABELS } from '@/features/onboarding/enum-labels';

type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

/**
 * Exemplo concreto em cada nível (F4-31): é a escolha que mais confunde e a
 * que mais muda a meta. Os exemplos descrevem rotina, nunca recomendam nada.
 */
const ACTIVITY_LEVEL_EXAMPLES: Record<ActivityLevel, string> = {
  sedentary: 'Passa a maior parte do dia sentado — ex.: trabalho de escritório, pouca caminhada',
  light: 'Caminha no dia a dia ou faz exercício leve de 1 a 3 vezes por semana',
  moderate: 'Exercício moderado de 3 a 5 vezes por semana — ex.: academia, bicicleta',
  active: 'Exercício intenso quase todo dia, ou trabalho de pé o dia inteiro',
  very_active: 'Treino pesado todo dia ou trabalho físico intenso — ex.: construção, atleta',
};

export const ACTIVITY_OPTIONS: readonly RadioOption<ActivityLevel>[] = ACTIVITY_LEVELS.map(
  (level) => ({
    value: level,
    label: ACTIVITY_LEVEL_LABELS[level],
    description: ACTIVITY_LEVEL_EXAMPLES[level],
  }),
);
