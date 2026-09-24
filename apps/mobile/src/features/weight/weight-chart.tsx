import { useState } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { GotaVitalColors } from '@/constants/gota-vital-colors';
import { buildWeightChart, type WeightMeasurementLike } from './chart-geometry';

const CHART_HEIGHT = 180;
const PADDING = 16;

interface WeightChartProps {
  measurements: readonly WeightMeasurementLike[];
}

/**
 * Linha de evolução do peso. Única visualização do MVP.
 *
 * Só recebe medidas de uma fonte só (`manual`) — a tela nunca mistura fontes,
 * porque bioimpedância de aparelhos diferentes não é comparável (CLAUDE.md).
 */
export function WeightChart({ measurements }: WeightChartProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = GotaVitalColors[scheme];
  const [width, setWidth] = useState(0);

  const chart = buildWeightChart(measurements, {
    width,
    height: CHART_HEIGHT,
    padding: PADDING,
  });

  if (chart.points.length === 0) {
    return (
      <View className="items-center justify-center rounded-2xl border border-grafite/20 bg-white p-6">
        <Text className="text-center text-base text-grafite">
          Nenhum peso registrado ainda. Registre o primeiro acima para começar a acompanhar sua
          evolução.
        </Text>
      </View>
    );
  }

  return (
    <View
      className="gap-2 rounded-2xl border border-grafite/20 bg-white p-4"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width - 32)}>
      <View className="flex-row justify-between">
        <Text className="text-sm text-grafite">{chart.max.toFixed(1)} kg</Text>
        <Text className="text-sm text-grafite">{chart.min.toFixed(1)} kg</Text>
      </View>

      {width > 0 ? (
        <Svg width={width} height={CHART_HEIGHT}>
          <Line
            x1={PADDING}
            y1={CHART_HEIGHT - PADDING}
            x2={width - PADDING}
            y2={CHART_HEIGHT - PADDING}
            stroke={colors.grafite}
            strokeOpacity={0.15}
            strokeWidth={1}
          />
          {chart.points.length > 1 ? (
            <Polyline
              points={chart.polyline}
              fill="none"
              stroke={colors.couve}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
          {chart.points.map((point) => (
            <Circle
              key={`${point.measuredAt}-${point.weightKg}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={colors.couve}
            />
          ))}
        </Svg>
      ) : (
        // Primeiro render ainda não tem largura medida pelo onLayout.
        <View style={{ height: CHART_HEIGHT }} />
      )}

      {chart.points.length === 1 ? (
        <Text className="text-center text-sm text-grafite">
          Registre outro peso para ver a linha de evolução.
        </Text>
      ) : null}
    </View>
  );
}
