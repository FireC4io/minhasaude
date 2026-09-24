/**
 * Geometria do gráfico de evolução de peso.
 *
 * Fica separada do componente de propósito: é a única lógica real da tela e
 * teste de render é não-confiável neste ambiente (ver CLAUDE.md).
 */

/** Só o que a geometria precisa da medição — casa com BodyMeasurementResponseDto. */
export interface WeightMeasurementLike {
  measuredAt: string;
  weightKg: string;
}

export interface ChartPoint {
  x: number;
  y: number;
  weightKg: number;
  measuredAt: string;
}

export interface WeightChart {
  points: ChartPoint[];
  min: number;
  max: number;
  polyline: string;
}

export interface ChartSize {
  width: number;
  height: number;
  padding: number;
}

const EMPTY: WeightChart = { points: [], min: 0, max: 0, polyline: '' };

interface ParsedMeasurement {
  measuredAt: string;
  timestamp: number;
  weightKg: number;
}

function parse(measurements: readonly WeightMeasurementLike[]): ParsedMeasurement[] {
  return measurements
    .map((m) => ({
      measuredAt: m.measuredAt,
      timestamp: new Date(m.measuredAt).getTime(),
      weightKg: Number(m.weightKg),
    }))
    .filter((m) => Number.isFinite(m.weightKg) && Number.isFinite(m.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function buildWeightChart(
  measurements: readonly WeightMeasurementLike[],
  { width, height, padding }: ChartSize,
): WeightChart {
  const parsed = parse(measurements);
  const first = parsed[0];

  if (!first) {
    return EMPTY;
  }

  const weights = parsed.map((m) => m.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);

  if (parsed.length === 1) {
    const point: ChartPoint = {
      x: width / 2,
      y: height / 2,
      weightKg: first.weightKg,
      measuredAt: first.measuredAt,
    };
    return { points: [point], min, max, polyline: formatPolyline([point]) };
  }

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const firstAt = first.timestamp;
  const timeSpan = (parsed[parsed.length - 1] ?? first).timestamp - firstAt;
  const weightSpan = max - min;

  const points = parsed.map((m, index) => ({
    measuredAt: m.measuredAt,
    weightKg: m.weightKg,
    // Sem amplitude de tempo (tudo no mesmo instante) o índice vira o eixo,
    // só pra não dividir por zero e ainda mostrar todos os pontos.
    x:
      timeSpan === 0
        ? padding + (innerWidth * index) / (parsed.length - 1)
        : padding + (innerWidth * (m.timestamp - firstAt)) / timeSpan,
    // y cresce pra baixo no SVG, então o peso maior recebe o menor y. Sem
    // variação de peso, a linha fica reta no meio.
    y:
      weightSpan === 0
        ? height / 2
        : padding + (innerHeight * (max - m.weightKg)) / weightSpan,
  }));

  return { points, min, max, polyline: formatPolyline(points) };
}

function formatPolyline(points: readonly ChartPoint[]): string {
  return points.map((p) => `${round(p.x)},${round(p.y)}`).join(' ');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
