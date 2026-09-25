import { buildWeightChart } from './chart-geometry';

const SIZE = { width: 300, height: 100, padding: 10 };

function measurement(measuredAt: string, weightKg: string) {
  return { measuredAt, weightKg };
}

describe('buildWeightChart', () => {
  it('devolve gráfico vazio quando não há medições', () => {
    const chart = buildWeightChart([], SIZE);

    expect(chart.points).toEqual([]);
    expect(chart.polyline).toBe('');
  });

  it('centraliza o único ponto quando só há uma medição', () => {
    // Com um ponto só não existe amplitude: não pode dividir por zero nem
    // encostar o ponto na borda.
    const chart = buildWeightChart([measurement('2026-09-01T12:00:00.000Z', '80.0')], SIZE);

    expect(chart.points).toHaveLength(1);
    expect(chart.points[0]!.x).toBeCloseTo(150);
    expect(chart.points[0]!.y).toBeCloseTo(50);
    expect(chart.points[0]!.weightKg).toBe(80);
  });

  it('ordena por data crescente mesmo recebendo a lista da API em ordem decrescente', () => {
    const chart = buildWeightChart(
      [
        measurement('2026-09-03T12:00:00.000Z', '78.0'),
        measurement('2026-09-01T12:00:00.000Z', '80.0'),
        measurement('2026-09-02T12:00:00.000Z', '79.0'),
      ],
      SIZE,
    );

    expect(chart.points.map((p) => p.weightKg)).toEqual([80, 79, 78]);
  });

  it('encosta o primeiro e o último ponto nas bordas internas', () => {
    const chart = buildWeightChart(
      [
        measurement('2026-09-01T12:00:00.000Z', '80.0'),
        measurement('2026-09-05T12:00:00.000Z', '78.0'),
      ],
      SIZE,
    );

    expect(chart.points[0]!.x).toBeCloseTo(10);
    expect(chart.points[1]!.x).toBeCloseTo(290);
  });

  it('distribui o eixo x pelo tempo decorrido, não pela posição na lista', () => {
    // Dia 1 e dia 2 estão colados; dia 10 fica longe. Espaçar por índice
    // mentiria sobre o ritmo da evolução.
    const chart = buildWeightChart(
      [
        measurement('2026-09-01T00:00:00.000Z', '80.0'),
        measurement('2026-09-02T00:00:00.000Z', '79.0'),
        measurement('2026-09-11T00:00:00.000Z', '78.0'),
      ],
      SIZE,
    );

    const inner = SIZE.width - SIZE.padding * 2;
    expect(chart.points[1]!.x).toBeCloseTo(SIZE.padding + inner * 0.1);
  });

  it('inverte o eixo y: peso maior fica mais alto na tela', () => {
    const chart = buildWeightChart(
      [
        measurement('2026-09-01T12:00:00.000Z', '80.0'),
        measurement('2026-09-02T12:00:00.000Z', '70.0'),
      ],
      SIZE,
    );

    const [maior, menor] = chart.points as [
      (typeof chart.points)[number],
      (typeof chart.points)[number],
    ];
    expect(maior.weightKg).toBe(80);
    expect(maior.y).toBeLessThan(menor.y);
    expect(maior.y).toBeCloseTo(10);
    expect(menor.y).toBeCloseTo(90);
  });

  it('não divide por zero quando todos os pesos são iguais', () => {
    const chart = buildWeightChart(
      [
        measurement('2026-09-01T12:00:00.000Z', '75.0'),
        measurement('2026-09-02T12:00:00.000Z', '75.0'),
      ],
      SIZE,
    );

    expect(chart.points.every((p) => Number.isFinite(p.y))).toBe(true);
    expect(chart.points.every((p) => p.y === 50)).toBe(true);
  });

  it('não divide por zero quando todas as medições são do mesmo instante', () => {
    const chart = buildWeightChart(
      [
        measurement('2026-09-01T12:00:00.000Z', '75.0'),
        measurement('2026-09-01T12:00:00.000Z', '76.0'),
      ],
      SIZE,
    );

    expect(chart.points.every((p) => Number.isFinite(p.x))).toBe(true);
  });

  it('descarta medição com peso não numérico em vez de quebrar o gráfico', () => {
    const chart = buildWeightChart(
      [
        measurement('2026-09-01T12:00:00.000Z', '80.0'),
        measurement('2026-09-02T12:00:00.000Z', 'n/a'),
        measurement('2026-09-03T12:00:00.000Z', '78.0'),
      ],
      SIZE,
    );

    expect(chart.points.map((p) => p.weightKg)).toEqual([80, 78]);
  });

  it('expõe min e max do período para rotular o eixo', () => {
    const chart = buildWeightChart(
      [
        measurement('2026-09-01T12:00:00.000Z', '80.5'),
        measurement('2026-09-02T12:00:00.000Z', '77.25'),
      ],
      SIZE,
    );

    expect(chart.min).toBe(77.25);
    expect(chart.max).toBe(80.5);
  });

  it('formata a polyline no padrão "x,y x,y" do SVG', () => {
    const chart = buildWeightChart(
      [
        measurement('2026-09-01T12:00:00.000Z', '80.0'),
        measurement('2026-09-02T12:00:00.000Z', '70.0'),
      ],
      SIZE,
    );

    expect(chart.polyline).toBe('10,10 290,90');
  });
});
