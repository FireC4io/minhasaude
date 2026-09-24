import { useState } from 'react';
import { Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { GotaVitalColors } from '@/constants/gota-vital-colors';
import { buildWeightChart, type WeightMeasurementLike } from './chart-geometry';

const CHART_HEIGHT = 180;
const PADDING = 16;
// Margem que o gráfico não ocupa: padding lateral da tela (24 de cada lado)
// mais o padding do card (16 de cada lado).
const MARGEM_HORIZONTAL = 80;

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
  const { width: larguraDaJanela } = useWindowDimensions();
  const [larguraMedida, setLarguraMedida] = useState<number | null>(null);

  // No react-native-web o onLayout não dispara de forma confiável neste
  // componente (verificado no navegador: o elemento media 1838px e o estado
  // seguia 0, então o SVG nunca era montado). A largura da janela dá um valor
  // utilizável já no primeiro render; o onLayout só refina quando chega.
  const width = larguraMedida ?? Math.max(larguraDaJanela - MARGEM_HORIZONTAL, 1);

  const chart = buildWeightChart(measurements, {
    width,
    height: CHART_HEIGHT,
    padding: PADDING,
  });

  if (chart.points.length === 0) {
    return (
      <View className="items-center justify-center rounded-2xl border border-grafite/20 bg-superficie p-6">
        <Text className="text-center text-base text-grafite">
          Nenhum peso registrado ainda. Registre o primeiro acima para começar a acompanhar sua
          evolução.
        </Text>
      </View>
    );
  }

  return (
    <View
      className="gap-2 rounded-2xl border border-grafite/20 bg-superficie p-4"
      onLayout={(event) => setLarguraMedida(event.nativeEvent.layout.width - 32)}>
      <View className="flex-row justify-between">
        <Text className="text-sm text-grafite">{chart.max.toFixed(1)} kg</Text>
        <Text className="text-sm text-grafite">{chart.min.toFixed(1)} kg</Text>
      </View>

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

      {chart.points.length === 1 ? (
        <Text className="text-center text-sm text-grafite">
          Registre outro peso para ver a linha de evolução.
        </Text>
      ) : null}
    </View>
  );
}
