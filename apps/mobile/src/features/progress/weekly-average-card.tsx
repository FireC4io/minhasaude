import { useQueries } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

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
  { key: 'kcal', label: 'Calorias', unit: 'kcal' },
  { key: 'proteinG', label: 'Proteínas', unit: 'g' },
  { key: 'fatG', label: 'Gorduras', unit: 'g' },
  { key: 'carbG', label: 'Carboidratos', unit: 'g' },
] as const;

/** Médias da semana, navegando entre semanas (F4-33). */
export function WeeklyAverageCard() {
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
  const range = `${shortDay(firstDay)} a ${shortDay(lastDay)}`;

  return (
    <View className="gap-3 rounded-2xl bg-superficie p-4">
      <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
        Média da semana
      </AppText>

      <View className="flex-row items-center justify-between">
        <TextButton
          label="‹"
          accessibilityLabel="Semana anterior"
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
          accessibilityLabel="Próxima semana"
          disabled={isCurrentWeek}
          onPress={() => setAnchor(addDaysToIsoDate(lastDay, 1))}
          textVariant="subtitle"
          textClassName="text-grafite"
          className="items-center"
        />
      </View>

      {isLoading ? (
        <LoadingIndicator label="Calculando a média da semana" />
      ) : !summary.average ? (
        <AppText className="text-grafite-suave">Nenhum dia registrado nesta semana.</AppText>
      ) : (
        <View className="gap-2">
          <AppText variant="caption" className="text-grafite-suave">
            {summary.daysLogged === 1
              ? 'Baseada em 1 dia com registro.'
              : `Baseada em ${summary.daysLogged} dias com registro.`}
          </AppText>
          {ROWS.map(({ key, label, unit }) => {
            const value = Math.round(summary.average?.[key] ?? 0);
            const target = summary.target ? Math.round(summary.target[key]) : null;
            const text = target ? `${value} de ${target} ${unit}` : `${value} ${unit}`;
            return (
              <View
                key={key}
                accessible
                accessibilityLabel={`${label}: média de ${text} por dia`}
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
