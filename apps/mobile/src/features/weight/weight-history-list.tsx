import { View } from 'react-native';

import type { BodyMeasurementResponseDto } from '@/api/generated/models';
import { describeWeightEntry } from './accessibility-labels';
import { formatKg } from './format-weight';
import { AppText } from '@/components/ui/app-text';
import { appLocale } from '@/i18n/format';

interface WeightHistoryListProps {
  measurements: readonly BodyMeasurementResponseDto[];
}

function formatMeasuredAt(measuredAt: string): string {
  return new Date(measuredAt).toLocaleDateString(appLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function WeightHistoryList({ measurements }: WeightHistoryListProps) {
  if (measurements.length === 0) {
    return null;
  }

  return (
    <View className="gap-2">
      <AppText variant="heading" accessibilityRole="header" className="text-grafite">
        Histórico
      </AppText>

      <View className="overflow-hidden rounded-2xl border border-linha bg-superficie">
        {measurements.map((measurement, index) => (
          <View
            key={measurement.id}
            // Data e peso numa frase só, com o mês por extenso — o texto
            // visual abrevia ("12 de set.") e o "kg" seria soletrado.
            accessible
            accessibilityLabel={describeWeightEntry(measurement)}
            className={`flex-row items-center justify-between px-4 py-3 ${
              index > 0 ? 'border-t border-linha' : ''
            }`}>
            <AppText className="text-grafite">{formatMeasuredAt(measurement.measuredAt)}</AppText>
            <AppText variant="number" className="text-grafite">
              {formatKg(measurement.weightKg)}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
