import { Text, View } from 'react-native';

import type { BodyMeasurementResponseDto } from '@/api/generated/models';

interface WeightHistoryListProps {
  measurements: readonly BodyMeasurementResponseDto[];
}

function formatMeasuredAt(measuredAt: string): string {
  return new Date(measuredAt).toLocaleDateString('pt-BR', {
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
      <Text className="text-lg font-semibold text-grafite">Histórico</Text>

      <View className="overflow-hidden rounded-2xl border border-grafite/20 bg-white">
        {measurements.map((measurement, index) => (
          <View
            key={measurement.id}
            className={`flex-row items-center justify-between px-4 py-3 ${
              index > 0 ? 'border-t border-grafite/10' : ''
            }`}>
            <Text className="text-base text-grafite">{formatMeasuredAt(measurement.measuredAt)}</Text>
            <Text className="text-base font-semibold text-grafite">
              {Number(measurement.weightKg).toFixed(1)} kg
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
