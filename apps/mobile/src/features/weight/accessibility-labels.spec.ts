import { describeWeightEntry, describeWeightTrend } from './accessibility-labels';

// Meio-dia UTC: a data fica a mesma em qualquer fuso do Brasil.
const SET_01 = '2026-09-01T12:00:00.000Z';
const SET_10 = '2026-09-10T12:00:00.000Z';
const SET_20 = '2026-09-20T12:00:00.000Z';

describe('describeWeightEntry', () => {
  it('lê a data por extenso e o peso com a unidade', () => {
    expect(describeWeightEntry({ measuredAt: SET_10, weightKg: '68.50' })).toBe(
      '10 de setembro de 2026, 68,5 quilos',
    );
  });
});

describe('describeWeightTrend', () => {
  it('sem medições não descreve nada — o estado vazio já fala por si', () => {
    expect(describeWeightTrend([])).toBeNull();
  });

  it('com uma medição só, diz o valor e a data', () => {
    expect(describeWeightTrend([{ measuredAt: SET_10, weightKg: '70.5' }])).toBe(
      'Gráfico de evolução do peso com 1 registro: 70,5 quilos em 10 de setembro de 2026.',
    );
  });

  it('descreve período, primeiro e último valor, variação e extremos', () => {
    expect(
      describeWeightTrend([
        { measuredAt: SET_01, weightKg: '70.0' },
        { measuredAt: SET_10, weightKg: '71.2' },
        { measuredAt: SET_20, weightKg: '68.5' },
      ]),
    ).toBe(
      'Gráfico de evolução do peso com 3 registros, de 1 de setembro de 2026 a 20 de setembro de 2026. ' +
        'Primeiro registro: 70 quilos. Mais recente: 68,5 quilos, redução de 1,5 quilo. ' +
        'Menor valor: 68,5 quilos. Maior valor: 71,2 quilos.',
    );
  });

  it('ordena por data mesmo que a API devolva do mais recente pro mais antigo', () => {
    const description = describeWeightTrend([
      { measuredAt: SET_20, weightKg: '72.0' },
      { measuredAt: SET_01, weightKg: '70.0' },
    ]);

    expect(description).toContain('Primeiro registro: 70 quilos. Mais recente: 72 quilos, aumento de 2 quilos.');
  });

  it('diz que não houve variação quando o peso se manteve', () => {
    const description = describeWeightTrend([
      { measuredAt: SET_01, weightKg: '70.0' },
      { measuredAt: SET_20, weightKg: '70.0' },
    ]);

    expect(description).toContain('Mais recente: 70 quilos, sem variação.');
  });

  it('ignora medições com peso inválido em vez de falar "NaN"', () => {
    expect(
      describeWeightTrend([
        { measuredAt: SET_01, weightKg: 'abc' },
        { measuredAt: SET_10, weightKg: '70.5' },
      ]),
    ).toBe('Gráfico de evolução do peso com 1 registro: 70,5 quilos em 10 de setembro de 2026.');
  });
});
