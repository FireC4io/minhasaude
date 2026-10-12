import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { weekdayNames } from '@/features/diary/date-utils';

import { WEEKDAYS, shiftTime } from './reminder-settings';

const STEP_MINUTES = 15;

interface TimeStepperProps {
  /** Nome do lembrete, para o leitor de tela dizer qual horário muda. */
  name: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Horário com "−" e "+" de 15 em 15 minutos. Mais fácil que um relógio de
 * rolar para quem tem pouca familiaridade com celular ou pouca firmeza na mão.
 */
export function TimeStepper({ name, value, onChange }: Readonly<TimeStepperProps>) {
  const { t } = useTranslation();
  const button = (sign: -1 | 1) => (
    <Pressable
      onPress={() => onChange(shiftTime(value, sign * STEP_MINUTES))}
      accessibilityRole="button"
      accessibilityLabel={t(sign < 0 ? 'reminders.earlierSpoken' : 'reminders.laterSpoken', { name })}
      style={{ minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET }}
      className="items-center justify-center rounded-full border border-grafite active:opacity-70">
      <AppText variant="bodyStrong" className="text-grafite">
        {sign < 0 ? '−' : '+'}
      </AppText>
    </Pressable>
  );
  return (
    <View className="flex-row items-center gap-3">
      {button(-1)}
      <AppText
        variant="numberLarge"
        accessibilityLabel={t('reminders.timeSpoken', { name, time: value })}
        accessibilityLiveRegion="polite"
        className="min-w-20 text-center text-grafite">
        {value}
      </AppText>
      {button(1)}
    </View>
  );
}

interface WeekdayPickerProps {
  value: readonly number[];
  onChange: (value: number[]) => void;
}

/** Os sete dias, cada um liga e desliga. Ordem de segunda a domingo. */
export function WeekdayPicker({ value, onChange }: Readonly<WeekdayPickerProps>) {
  const short = weekdayNames('short');
  return (
    <View className="flex-row flex-wrap gap-2">
      {WEEKDAYS.map((day) => {
        const checked = value.includes(day);
        const label = short[day % 7] ?? '';
        return (
          <Pressable
            key={day}
            onPress={() => onChange(checked ? value.filter((d) => d !== day) : [...value, day].sort())}
            accessibilityRole="checkbox"
            accessibilityLabel={label}
            accessibilityState={{ checked }}
            style={{ minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET, justifyContent: 'center' }}
            className={
              checked
                ? 'items-center rounded-full bg-mamao-forte px-3 active:opacity-80'
                : 'items-center rounded-full border border-grafite px-3 active:opacity-80'
            }>
            <AppText className={checked ? 'text-areia' : 'text-grafite'}>{label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
