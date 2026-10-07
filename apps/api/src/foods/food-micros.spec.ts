import { foodMicrosPer100g } from './food-micros';

describe('foodMicrosPer100g', () => {
  it('lê o jsonb e completa as chaves ausentes com null', () => {
    const micros = foodMicrosPer100g({ microsPer100g: { ironMg: 1.29 }, fiberGPer100g: null });
    expect(micros.ironMg).toBe(1.29);
    expect(micros.sodiumMg).toBeNull();
  });

  it('sem jsonb, aproveita a coluna antiga de fibra', () => {
    expect(foodMicrosPer100g({ microsPer100g: null, fiberGPer100g: '2.50' }).fiberG).toBe(2.5);
  });

  it('ignora valor que não é número (nunca inventa)', () => {
    const micros = foodMicrosPer100g({
      microsPer100g: { zincMg: 'abc' as unknown as number },
      fiberGPer100g: null,
    });
    expect(micros.zincMg).toBeNull();
  });
});
