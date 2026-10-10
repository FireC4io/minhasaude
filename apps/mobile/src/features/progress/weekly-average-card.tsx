import { useQueries } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getDiaryControllerGetByDateQueryOptions } from '@/api/generated/endpoints/diary/diary';
import { AppText } from '@/components/ui/app-text';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { TextButton } from '@/components/ui/text-button';
import { addDaysToIsoDate, localDateFromIso, todayIsoDate, weekOf } from '@/features/diary/date-utils';

import { spokenGrams, spokenKcal } from '@/features/accessibility/spoken-format';
import { appLocale } from '@/i18n/format';

import { weeklyAverage } from './weekly-summary';

const dayLabel = (date: string, month: 'short' | 'long'): string =>
  localDateFromIso(date).toLocaleDateString(appLocale(), { day: 'numeric', month });

// Na tela, a sigla; no rótulo falado, a unidade por extenso (o leitor de tela
// soletra "kcal" e lê "g" como letra).
const ROWS = [
  { key: 'kcal', labelKey: 'today.calories', unit: 'kcal', spoken: spokenKcal },
  { key: 'proteinG', labelKey: 'today.protein', unit: 'g', spoken: spokenGrams },
  { key: 'fatG', labelKey: 'today.fat', unit: 'g', spoken: spokenGrams },
  { key: 'carbG', labelKey: 'today.carbs', unit: 'g', spoken: spokenGrams },
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
  const range = t('progress.weekRange', { from: dayLabel(firstDay, 'short'), to: dayLabel(lastDay, 'short') });
  // "out." seria lido como "out ponto": por extenso para o leitor de tela.
  const spokenRange = t('progress.weekRange', { from: dayLabel(firstDay, 'long'), to: dayLabel(lastDay, 'long') });

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
        <AppText
          variant="bodyStrong"
          accessibilityLabel={spokenRange}
          accessibilityLiveRegion="polite"
          className="text-grafite">
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
          {ROWS.map(({ key, labelKey, unit, spoken }) => {
            const label = t(labelKey);
            const value = Math.round(summary.average?.[key] ?? 0);
            const target = summary.target ? Math.round(summary.target[key]) : null;
            const text = target ? t('progress.valueOf', { value, target, unit }) : `${value} ${unit}`;
            const spokenText = target
              ? t('progress.valueOfSpoken', { value, target: spoken(target) })
              : spoken(value);
            return (
              <View
                key={key}
                accessible
                accessibilityLabel={t('progress.averageSpoken', { label, text: spokenText })}
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
