import { useQueries } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getDiaryControllerGetByDateQueryOptions } from '@/api/generated/endpoints/diary/diary';
import { AppText } from '@/components/ui/app-text';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { TextButton } from '@/components/ui/text-button';
import { addDaysToIsoDate, localDateFromIso, todayIsoDate, weekOf } from '@/features/diary/date-utils';

import { weeklyAverage } from './weekly-summary';
import { appLocale } from '@/i18n/format';

const shortDay = (date: string): string =>
  localDateFromIso(date).toLocaleDateString(appLocale(), { day: 'numeric', month: 'short' });

const ROWS = [
  { key: 'kcal', labelKey: 'today.calories', unit: 'kcal' },
  { key: 'proteinG', labelKey: 'today.protein', unit: 'g' },
  { key: 'fatG', labelKey: 'today.fat', unit: 'g' },
  { key: 'carbG', labelKey: 'today.carbs', unit: 'g' },
] as const;

/** Médias da semana, navegando entre semanas (F4-33). */
export function WeeklyAverageCard() {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState(todayIsoDate());
  const week = weekOf(anchor);
  const firstDay = week[0] ?? anchor;
  const lastDay = week[6] ?? anchor;
  const isCurrentWeek = week.includes(todayIsoDate());

  const results = useQueries({
    queries: week.map((date) => getDiaryControllerGetByDateQueryOptions({ date })),
  });
  const isLoading = results.some((result) => result.isPending);
  const summary = weeklyAverage(results.map((result) => result.data));
  const range = t('progress.weekRange', { from: shortDay(firstDay), to: shortDay(lastDay) });

  return (
    <View className="gap-3 rounded-2xl bg-superficie p-4">
      <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
        {t('progress.weekAverage')}
      </AppText>

      <View className="flex-row items-center justify-between">
        <TextButton
          label="‹"
          accessibilityLabel={t('progress.previousWeek')}
          onPress={() => setAnchor(addDaysToIsoDate(firstDay, -1))}
          textVariant="subtitle"
          textClassName="text-grafite"
          className="items-center"
        />
        <AppText variant="bodyStrong" accessibilityLiveRegion="polite" className="text-grafite">
          {range}
        </AppText>
        <TextButton
          label="›"
          accessibilityLabel={t('progress.nextWeek')}
          disabled={isCurrentWeek}
          onPress={() => setAnchor(addDaysToIsoDate(lastDay, 1))}
          textVariant="subtitle"
          textClassName="text-grafite"
          className="items-center"
        />
      </View>

      {isLoading ? (
        <LoadingIndicator label={t('progress.loadingWeek')} />
      ) : !summary.average ? (
        <AppText className="text-grafite-suave">{t('progress.noDays')}</AppText>
      ) : (
        <View className="gap-2">
          <AppText variant="caption" className="text-grafite-suave">
            {t('progress.basedOn', { count: summary.daysLogged })}
          </AppText>
          {ROWS.map(({ key, labelKey, unit }) => {
            const label = t(labelKey);
            const value = Math.round(summary.average?.[key] ?? 0);
            const target = summary.target ? Math.round(summary.target[key]) : null;
            const text = target ? t('progress.valueOf', { value, target, unit }) : `${value} ${unit}`;
            return (
              <View
                key={key}
                accessible
                accessibilityLabel={t('progress.averageSpoken', { label, text })}
                className="flex-row flex-wrap items-baseline justify-between gap-x-3">
                <AppText className="text-grafite">{label}</AppText>
                <AppText variant="number" className="text-grafite">
                  {text}
                </AppText>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
