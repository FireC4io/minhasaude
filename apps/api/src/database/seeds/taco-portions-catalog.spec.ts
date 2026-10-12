import { TACO_CSV_PATH, readTacoRows } from './taco-catalog';
import { TACO_PORTIONS_CSV_PATH, readTacoPortions } from './taco-portions-catalog';

describe('readTacoPortions', () => {
  const portions = readTacoPortions(TACO_PORTIONS_CSV_PATH);
  const taco = new Map(readTacoRows(TACO_CSV_PATH).rows.map((r) => [r.externalId, r.name]));
  const of = (name: string) => {
    const id = [...taco].find(([, n]) => n === name)?.[0];
    return Object.fromEntries(portions.filter((p) => p.tacoId === id).map((p) => [p.kind, p.grams]));
  };

  it('toda medida aponta para um alimento da TACO carregado no banco', () => {
    const missing = portions.filter((p) => !taco.has(p.tacoId));
    expect(missing).toEqual([]);
  });

  it('no máximo uma medida de cada tipo por alimento', () => {
    const keys = portions.map((p) => `${p.tacoId}:${p.kind}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('cobre os básicos com os valores do IBGE', () => {
    expect(of('Arroz, tipo 1, cozido')).toMatchObject({ serving_spoon: 45, tablespoon: 25 });
    expect(of('Feijão, carioca, cozido')).toMatchObject({ ladle: 140 });
    expect(of('Pão, trigo, francês')).toEqual({ unit: 50 });
    expect(of('Ovo, de galinha, inteiro, cozido/10minutos')).toMatchObject({ unit: 45 });
    expect(of('Açúcar, refinado')).toMatchObject({ teaspoon: 5, tablespoon: 24 });
  });

  it('copo e lata só em bebida: fruta crua não ganha "copo" vindo de suco', () => {
    expect(of('Laranja, pêra, crua')).toEqual({ unit: 180 });
    expect(of('Mel, de abelha').cup).toBeUndefined();
  });
});
