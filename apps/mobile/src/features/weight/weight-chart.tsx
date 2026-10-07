import { useState } from 'react';
import { useColorScheme, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { GotaVitalColors } from '@/constants/gota-vital-colors';

import { describeWeightTrend } from './accessibility-labels';
import { buildWeightChart, type WeightMeasurementLike } from './chart-geometry';
import { formatKg } from './format-weight';
import { appLocale } from '@/i18n/format';

const CHART_HEIGHT = 180;
const PADDING = 12;
// Coluna dos rótulos do eixo vertical.
const AXIS_WIDTH = 72;
// Margem que o gráfico não ocupa: padding da tela (24 + 24) e do card (16 + 16),
// mais a coluna do eixo.
const HORIZONTAL_MARGIN = 80 + AXIS_WIDTH;
// Em tablet e na web o gráfico não estica até 1.800 px (achado do #32).
const MAX_CHART_WIDTH = 640;

interface WeightChartProps {
  measurements: readonly WeightMeasurementLike[];
}

const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(appLocale(), { day: 'numeric', month: 'short' });

/**
 * Linha de evolução do peso (F4-17): máximo em cima e mínimo embaixo no eixo
 * vertical, datas do primeiro e do último registro embaixo, e o último ponto
 * com forma própria (quadrado) — legível em escala de cinza (F4-10).
 *
 * Só recebe medidas de uma fonte (`manual`): bioimpedância de aparelhos
 * diferentes não é comparável (CLAUDE.md).
 */
export function WeightChart({ measurements }: WeightChartProps) {
  const colors = GotaVitalColors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  // No react-native-web o onLayout não chega de forma confiável: a largura da
  // janela dá um valor já no primeiro render, e o onLayout só refina.
  const width = Math.min(
    MAX_CHART_WIDTH,
    Math.max(measuredWidth ?? windowWidth - HORIZONTAL_MARGIN, 1),
  );

  const chart = buildWeightChart(measurements, { width, height: CHART_HEIGHT, padding: PADDING });
  const first = chart.points[0];
  const last = chart.points[chart.points.length - 1];

  if (!first || !last) {
    return (
      <View className="items-center justify-center rounded-2xl border border-linha bg-superficie p-6">
        <AppText className="text-center text-grafite">
          Nenhum peso neste período. Registre um peso acima para começar a acompanhar.
        </AppText>
      </View>
    );
  }

  return (
    // O SVG é invisível para leitor de tela: o card vira uma imagem com a
    // tendência descrita em texto.
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={describeWeightTrend(measurements) ?? undefined}
      className="gap-2 rounded-2xl border border-linha bg-superficie p-4">
      <View
        className="flex-row"
        onLayout={(event) =>
          setMeasuredWidth(event.nativeEvent.layout.width - AXIS_WIDTH)
        }>
        <View
          style={{ width: AXIS_WIDTH, height: CHART_HEIGHT, paddingVertical: PADDING - 9 }}
          className="justify-between">
          <AppText variant="number" className="text-grafite">
            {formatKg(chart.max)}
          </AppText>
          {chart.max !== chart.min ? (
            <AppText variant="number" className="text-grafite">
              {formatKg(chart.min)}
            </AppText>
          ) : null}
        </View>

        <Svg width={width} height={CHART_HEIGHT}>
          <Line
            x1={PADDING}
            y1={PADDING}
            x2={width - PADDING}
            y2={PADDING}
            stroke={colors.linha}
            strokeWidth={1}
          />
          <Line
            x1={PADDING}
            y1={CHART_HEIGHT - PADDING}
            x2={width - PADDING}
            y2={CHART_HEIGHT - PADDING}
            stroke={colors.linha}
            strokeWidth={1}
          />
          {chart.points.length > 1 ? (
            <Polyline
              points={chart.polyline}
              fill="none"
              stroke={colors.couve}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
          {chart.points.slice(0, -1).map((point) => (
            <Circle
              key={`${point.measuredAt}-${point.weightKg}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={colors.superficie}
              stroke={colors.couve}
              strokeWidth={2}
            />
          ))}
          <Rect x={last.x - 6} y={last.y - 6} width={12} height={12} rx={2} fill={colors.grafite} />
        </Svg>
      </View>

      <View style={{ marginLeft: AXIS_WIDTH }} className="flex-row justify-between">
        <AppText variant="caption" className="text-grafite-suave">
          {shortDate(first.measuredAt)}
        </AppText>
        {chart.points.length > 1 ? (
          <AppText variant="caption" className="text-grafite-suave">
            {shortDate(last.measuredAt)} ■ último
          </AppText>
        ) : null}
      </View>

      {chart.points.length === 1 ? (
        <AppText variant="caption" className="text-center text-grafite">
          Registre outro peso para ver a linha de evolução.
        </AppText>
      ) : null}
    </View>
  );
}
