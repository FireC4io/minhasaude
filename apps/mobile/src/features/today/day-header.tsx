import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TextButton } from '@/components/ui/text-button';
import { formatIsoDateLabel, todayIsoDate } from '@/features/diary/date-utils';

interface DayHeaderProps {
  date: string;
  onOpenCalendar: () => void;
  onBackToToday: () => void;
}

/** O dia mostrado (abre o calendário) e, fora de hoje, o atalho para voltar. */
export function DayHeader({ date, onOpenCalendar, onBackToToday }: DayHeaderProps) {
  const { t } = useTranslation();
  const dateLabel = formatIsoDateLabel(date);
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-2">
      <TextButton
        label={`${dateLabel} ▾`}
        accessibilityLabel={t('today.shownDay', { date: dateLabel })}
        hint={t('today.openCalendar')}
        onPress={onOpenCalendar}
        textVariant="title"
        textClassName="capitalize text-grafite"
      />
      {date !== todayIsoDate() ? (
        <TextButton
          label={t('today.backToToday')}
          onPress={onBackToToday}
          textVariant="bodyStrong"
          textClassName="text-mamao-forte"
        />
      ) : null}
    </View>
  );
}
