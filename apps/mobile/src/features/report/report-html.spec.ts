import type { ProgressReport } from './progress-report';
import { escapeHtml, renderReportHtml } from './report-html';

function report(overrides: Partial<ProgressReport> = {}): ProgressReport {
  return {
    generatedAt: '2026-10-07T12:00:00.000Z',
    weight: null,
    weeks: [],
    goals: [],
    days: [],
    ...overrides,
  };
}

describe('renderReportHtml', () => {
  it('escapa o nome do alimento digitado pela pessoa', () => {
    const html = renderReportHtml(
      report({
        days: [
          {
            date: '2026-10-05',
            totals: { kcal: 100, proteinG: 1, fatG: 1, carbG: 1 },
            meals: [
              {
                label: 'Almoço',
                items: [{ name: '<img src=x onerror=alert(1)>', quantity: '100', unit: 'grams', kcal: 100 }],
              },
            ],
          },
        ],
      }),
    );

    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('mostra aviso amigável nas seções sem dados', () => {
    const html = renderReportHtml(report());

    expect(html).toContain('Nenhum peso registrado ainda.');
    expect(html).toContain('Nenhuma meta calculada ainda.');
  });

  it('desenha o gráfico e a diferença de peso com vírgula decimal', () => {
    const html = renderReportHtml(
      report({
        weight: {
          firstKg: 70.4,
          lastKg: 68.9,
          changeKg: -1.5,
          entries: [
            { measuredAt: '2026-09-01T10:00:00.000Z', weightKg: 70.4 },
            { measuredAt: '2026-10-01T10:00:00.000Z', weightKg: 68.9 },
          ],
        },
      }),
    );

    expect(html).toContain('<polyline');
    expect(html).toContain('−1,5 kg');
    expect(html).toContain('de 68,9 kg (embaixo) a 70,4 kg (em cima)');
  });

  it('é informativo e credita as fontes dos dados', () => {
    const html = renderReportHtml(report());

    expect(html).toContain('não substitui orientação');
    expect(html).toContain('TACO/Unicamp');
    expect(html).toContain('Open Food Facts');
    expect(html).not.toMatch(/recomendamos|você deve/i);
  });

  it('semana sem meta mostra traço, não zero', () => {
    const html = renderReportHtml(
      report({
        weeks: [
          {
            weekStart: '2026-10-04',
            weekEnd: '2026-10-10',
            daysLogged: 2,
            average: { kcal: 2000, proteinG: 80, fatG: 60, carbG: 250 },
            targetKcal: null,
          },
        ],
      }),
    );

    expect(html).toContain('<td class="num">—</td>');
  });
});

describe('escapeHtml', () => {
  it('escapa os cinco caracteres especiais', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});
