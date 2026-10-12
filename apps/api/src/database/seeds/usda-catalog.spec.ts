import { TACO_CSV_PATH, readTacoRows } from './taco-catalog';
import { USDA_FOODS_CSV_PATH, USDA_PORTIONS_CSV_PATH, readUsdaFoods, readUsdaPortions } from './usda-catalog';

describe('básicos do USDA', () => {
  const foods = readUsdaFoods(USDA_FOODS_CSV_PATH);
  const portions = readUsdaPortions(USDA_PORTIONS_CSV_PATH);
  const byName = (name: string) => foods.find((f) => f.name === name);

  it('nomes únicos e que não repetem um alimento da TACO', () => {
    const names = foods.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
    const taco = new Set(readTacoRows(TACO_CSV_PATH).rows.map((r) => r.name));
    expect(names.filter((n) => taco.has(n))).toEqual([]);
  });

  it('leite de vaca integral com os números do USDA (FNDDS 2705385)', () => {
    expect(byName('Leite de vaca, integral')).toMatchObject({
      fdcId: '2705385',
      kcalPer100g: 61,
      proteinGPer100g: 3.27,
      fatGPer100g: 3.2,
      carbGPer100g: 4.63,
    });
  });

  it('macros conferem com as calorias (4/9/4 kcal por grama, com folga de arredondamento)', () => {
    // Fora da conta: bebida alcoólica (álcool, 7 kcal/g, não entra nos macros) e chiclete sem
    // açúcar (o poliol conta como carboidrato mas rende menos de 4 kcal/g).
    const outside = /vinho|cerveja|vodca|^gim$|chiclete sem açúcar/i;
    const off = foods.filter((f) => !outside.test(f.name)).filter((f) => {
      const estimate = 4 * f.proteinGPer100g + 9 * f.fatGPer100g + 4 * f.carbGPer100g;
      return Math.abs(estimate - f.kcalPer100g) > Math.max(25, f.kcalPer100g * 0.2);
    });
    expect(off.map((f) => f.name)).toEqual([]);
  });

  it('toda medida aponta para um alimento da lista, uma de cada tipo', () => {
    const ids = new Set(foods.map((f) => f.fdcId));
    expect(portions.filter((p) => !ids.has(p.fdcId))).toEqual([]);
    const keys = portions.map((p) => `${p.fdcId}:${p.kind}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
