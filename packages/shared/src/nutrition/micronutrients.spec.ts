import {
  MICRONUTRIENT_KEYS,
  MICRONUTRIENTS,
  scaleMicros,
  sumMicros,
  type Micros,
} from './micronutrients';

const per100g: Micros = {
  fiberG: 8.5,
  sodiumMg: 1.76,
  potassiumMg: 254.6,
  calciumMg: 26.6,
  ironMg: 1.29,
  magnesiumMg: 42.3,
  zincMg: 0.7,
  vitaminCMg: 0,
  vitaminARaeMcg: null,
};

describe('micronutrientes', () => {
  it('nove nutrientes, cada um com nome e unidade', () => {
    expect(MICRONUTRIENT_KEYS).toHaveLength(9);
    expect(MICRONUTRIENTS.sodiumMg).toEqual({ label: 'Sódio', unit: 'mg' });
    expect(MICRONUTRIENTS.vitaminARaeMcg.unit).toBe('mcg');
  });

  it('escala pela quantidade em gramas, com 2 casas', () => {
    const portion = scaleMicros(per100g, 150);
    expect(portion.fiberG).toBe(12.75);
    expect(portion.potassiumMg).toBe(381.9);
  });

  it('nutriente não medido continua sem dado — nunca vira zero', () => {
    expect(scaleMicros(per100g, 150).vitaminARaeMcg).toBeNull();
  });

  it('soma do dia conta quantos itens tinham o dado', () => {
    const a = scaleMicros(per100g, 100);
    const b = { ...scaleMicros(per100g, 100), vitaminARaeMcg: 30 };
    const total = sumMicros([a, b, null]);

    expect(total.fiberG).toEqual({ amount: 17, itemsWithData: 2, items: 3 });
    expect(total.vitaminARaeMcg).toEqual({ amount: 30, itemsWithData: 1, items: 3 });
  });

  it('dia vazio: tudo zero e sem itens', () => {
    expect(sumMicros([]).sodiumMg).toEqual({ amount: 0, itemsWithData: 0, items: 0 });
  });
});
