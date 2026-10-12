import {
  OUNCE_GRAMS,
  customPortionSchema,
  PORTION_KINDS,
  PORTION_LIMITS,
  isPortionKind,
  gramsFromOunces,
  ouncesFromGrams,
} from './portions';

describe('medidas caseiras', () => {
  it('os tipos são códigos estáveis em inglês (o texto vem da tradução do app)', () => {
    expect(PORTION_KINDS).toContain('tablespoon');
    expect(PORTION_KINDS).toContain('unit');
    expect(new Set(PORTION_KINDS).size).toBe(PORTION_KINDS.length);
    for (const kind of PORTION_KINDS) expect(kind).toMatch(/^[a-z_]+$/);
  });

  it('reconhece só os tipos conhecidos', () => {
    expect(isPortionKind('slice')).toBe(true);
    expect(isPortionKind('colher')).toBe(false);
    expect(isPortionKind('')).toBe(false);
  });

  it('onça (oz) é a do sistema avoirdupois', () => {
    expect(OUNCE_GRAMS).toBe(28.349523125);
    expect(gramsFromOunces(1)).toBe(28.35);
    expect(gramsFromOunces(3.5)).toBe(99.22);
    expect(ouncesFromGrams(100)).toBe(3.53);
  });

  it('volta e ida sem desvio visível', () => {
    expect(ouncesFromGrams(gramsFromOunces(8))).toBe(8);
  });

  it('limites da medida criada pela pessoa', () => {
    expect(PORTION_LIMITS.gramsMin).toBeGreaterThan(0);
    expect(PORTION_LIMITS.gramsMax).toBeGreaterThanOrEqual(1000);
    expect(PORTION_LIMITS.customPerFood).toBeGreaterThan(0);
  });

  it('valida a medida criada pela pessoa', () => {
    expect(
      customPortionSchema.parse({ label: '  Minha caneca ', grams: 180 }),
    ).toEqual({ label: 'Minha caneca', grams: 180 });
    expect(
      customPortionSchema.safeParse({ label: '   ', grams: 180 }).success,
    ).toBe(false);
    expect(
      customPortionSchema.safeParse({ label: '<b>', grams: 180 }).success,
    ).toBe(false);
    expect(
      customPortionSchema.safeParse({ label: 'Pote', grams: 0 }).success,
    ).toBe(false);
    expect(
      customPortionSchema.safeParse({ label: 'Pote', grams: Number.NaN })
        .success,
    ).toBe(false);
  });
});
