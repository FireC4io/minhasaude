import type { Goal } from '@minhasaude/shared';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { RadioList } from '@/components/ui/radio-list';

import { paceOptionsFor, type PaceOption } from './weekly-pace';

interface WeeklyPacePickerProps {
  goal: Goal | null;
  value: PaceOption | null;
  onChange: (value: PaceOption) => void;
}

/** Só aparece para perder ou ganhar peso. */
export function WeeklyPacePicker({ goal, value, onChange }: WeeklyPacePickerProps) {
  if (!goal || goal === 'maintain') return null;
  return (
    <View className="gap-2">
      <RadioList
        label={goal === 'lose' ? 'Quanto quer perder por semana?' : 'Quanto quer ganhar por semana?'}
        options={paceOptionsFor(goal)}
        value={value}
        onChange={onChange}
      />
      <AppText variant="caption" className="text-grafite-suave">
        É uma estimativa usada para calcular sua meta de calorias, não uma promessa: cada corpo
        responde de um jeito. Você pode mudar quando quiser no Perfil.
      </AppText>
    </View>
  );
}
