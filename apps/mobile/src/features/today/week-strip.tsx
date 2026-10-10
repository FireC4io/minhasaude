import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { localDateFromIso, todayIsoDate, weekdayNames, weekOf } from '@/features/diary/date-utils';
import { appLocale } from '@/i18n/format';


interface WeekStripProps {
  selectedDate: string;
  daysWithEntries: ReadonlySet<string>;
  onSelect: (date: string) => void;
}

export const spokenDay = (date: string): string =>
  localDateFromIso(date).toLocaleDateString(appLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

/**
 * Domingo a sábado da semana exibida. O dia escolhido tem fundo; hoje tem
 * borda; dia com registro tem um ponto — e tudo isso também vai para o nome
 * falado, porque ponto e borda não chegam a quem não enxerga.
 */
export function WeekStrip({ selectedDate, daysWithEntries, onSelect }: WeekStripProps) {
  const { t } = useTranslation();
  const today = todayIsoDate();
  const initials = weekdayNames('narrow');

  return (
    <View accessibilityRole="tablist" className="flex-row justify-between">
      {weekOf(selectedDate).map((date, index) => {
        const selected = date === selectedDate;
        const isToday = date === today;
        const hasEntries = daysWithEntries.has(date);
        const spoken = `${spokenDay(date)}${isToday ? t('today.todaySuffix') : ''}${
          hasEntries ? t('today.withEntries') : ''
        }`;
        const frame = selected ? 'bg-mamao-forte' : isToday ? 'border-2 border-mamao-forte' : '';
        const dot = hasEntries ? (selected ? 'bg-areia' : 'bg-couve') : '';
        return (
          <Pressable
            key={date}
            onPress={() => onSelect(date)}
            accessibilityRole="tab"
            accessibilityLabel={spoken}
            accessibilityState={{ selected }}
            style={{ minHeight: MIN_TOUCH_TARGET + 16, minWidth: MIN_TOUCH_TARGET }}
            className={`items-center justify-center gap-0.5 rounded-2xl px-1 active:opacity-70 ${frame}`}>
            <AppText variant="caption" className={selected ? 'text-areia' : 'text-grafite-suave'}>
              {initials[index]}
            </AppText>
            <AppText variant="bodyStrong" className={selected ? 'text-areia' : 'text-grafite'}>
              {localDateFromIso(date).getDate()}
            </AppText>
            <View className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          </Pressable>
        );
      })}
    </View>
  );
}
