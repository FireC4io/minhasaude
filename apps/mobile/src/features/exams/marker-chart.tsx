import { useColorScheme, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { GotaVitalColors } from '@/constants/gota-vital-colors';
import { buildWeightChart } from '@/features/weight/chart-geometry';

import { formatExamDate, formatExamValue } from './exam-labels';

const HEIGHT = 160;
const PADDING = 12;
const AXIS_WIDTH = 72;
const MAX_WIDTH = 640;

interface MarkerPoint {
  date: string;
  value: number;
}

interface MarkerChartProps {
  points: readonly MarkerPoint[];
  unit: string;
  description: string;
}

/**
 * Evolução de um marcador entre exames. A geometria é a mesma do peso
 * (eixo x por tempo decorrido, não por índice). Descrita em texto para o
 * leitor de tela.
 */
export function MarkerChart({ points, unit, description }: MarkerChartProps) {
  const colors = GotaVitalColors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(MAX_WIDTH, Math.max(windowWidth - 80 - AXIS_WIDTH, 1));

  const chart = buildWeightChart(
    points.map((point) => ({
      measuredAt: `${point.date}T12:00:00`,
      weightKg: String(point.value),
    })),
    { width, height: HEIGHT, padding: PADDING },
  );

  if (chart.points.length < 2) return null;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={description}
      className="gap-2 rounded-2xl bg-superficie p-4">
      <View className="flex-row">
        <View
          style={{ width: AXIS_WIDTH, height: HEIGHT, paddingVertical: PADDING - 9 }}
          className="justify-between">
          <AppText variant="number" className="text-grafite">
            {formatExamValue(chart.max)}
          </AppText>
          <AppText variant="number" className="text-grafite">
            {formatExamValue(chart.min)}
          </AppText>
        </View>
        <Svg width={width} height={HEIGHT}>
          <Line x1={PADDING} y1={PADDING} x2={width - PADDING} y2={PADDING} stroke={colors.linha} />
          <Line
            x1={PADDING}
            y1={HEIGHT - PADDING}
            x2={width - PADDING}
            y2={HEIGHT - PADDING}
            stroke={colors.linha}
          />
          <Polyline
            points={chart.polyline}
            fill="none"
            stroke={colors.jabuticaba}
            strokeWidth={2.5}
          />
          {chart.points.map((point) => (
            <Circle
              key={point.measuredAt}
              cx={point.x}
              cy={point.y}
              r={4.5}
              fill={colors.superficie}
              stroke={colors.jabuticaba}
              strokeWidth={2}
            />
          ))}
        </Svg>
      </View>
      <View style={{ marginLeft: AXIS_WIDTH }} className="flex-row justify-between">
        <AppText variant="caption" className="text-grafite-suave">
          {formatExamDate(chart.points[0]?.measuredAt ?? null)}
        </AppText>
        <AppText variant="caption" className="text-grafite-suave">
          {formatExamDate(chart.points[chart.points.length - 1]?.measuredAt ?? null)}
        </AppText>
      </View>
      <AppText variant="caption" style={{ marginLeft: AXIS_WIDTH }} className="text-grafite-suave">
        Valores em {unit}
      </AppText>
    </View>
  );
}
