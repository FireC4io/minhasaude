import type { Goal } from '@minhasaude/shared';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  if (!goal || goal === 'maintain') return null;
  return (
    <View className="gap-2">
      <RadioList
        label={goal === 'lose' ? t('weeklyPace.loseQuestion') : t('weeklyPace.gainQuestion')}
        options={paceOptionsFor(goal)}
        value={value}
        onChange={onChange}
      />
      <AppText variant="caption" className="text-grafite-suave">
        {t('weeklyPace.caption')}
      </AppText>
    </View>
  );
}
