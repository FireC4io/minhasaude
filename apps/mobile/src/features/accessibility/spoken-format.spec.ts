import { spokenDate, spokenGrams, spokenKcal, spokenKg, displayNumber } from './spoken-format';

describe('spoken-format', () => {
  it('lê quilocalorias arredondadas, com plural correto', () => {
    expect(spokenKcal(127.6)).toBe('128 quilocalorias');
    expect(spokenKcal(1)).toBe('1 quilocaloria');
    expect(spokenKcal(2480)).toBe('2.480 quilocalorias');
  });

  it('lê gramas com vírgula decimal, não ponto', () => {
    expect(spokenGrams(130)).toBe('130 gramas');
    expect(spokenGrams(12.5)).toBe('12,5 gramas');
    expect(spokenGrams(1)).toBe('1 grama');
  });

  it('lê quilos com uma casa decimal no máximo', () => {
    expect(spokenKg(68.5)).toBe('68,5 quilos');
    expect(spokenKg(70)).toBe('70 quilos');
    expect(spokenKg(1)).toBe('1 quilo');
    expect(spokenKg(68.54)).toBe('68,5 quilos');
  });

  it('usa singular abaixo de 2 e plural no zero, como na norma culta', () => {
    expect(spokenKg(1.5)).toBe('1,5 quilo');
    expect(spokenGrams(0.5)).toBe('0,5 grama');
    expect(spokenKcal(0)).toBe('0 quilocalorias');
  });

  it('lê a data por extenso, sem abreviar o mês', () => {
    // Meio-dia UTC: fica no mesmo dia em qualquer fuso do Brasil.
    expect(spokenDate('2026-09-12T12:00:00.000Z')).toBe('12 de setembro de 2026');
  });
});

describe('displayNumber', () => {
  it('usa vírgula decimal e corta em uma casa', () => {
    expect(displayNumber(2.5)).toBe('2,5');
    expect(displayNumber(28.14)).toBe('28,1');
    expect(displayNumber(1200)).toBe('1.200');
  });
});
