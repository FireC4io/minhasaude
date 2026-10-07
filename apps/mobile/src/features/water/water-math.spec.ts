import { formatMl, glassesFilled, spokenWater } from './water-math';

describe('formatMl', () => {
  it('mostra litros a partir de 1.000 ml, com vírgula', () => {
    expect(formatMl(250)).toBe('250 ml');
    expect(formatMl(1000)).toBe('1 L');
    expect(formatMl(1750)).toBe('1,75 L');
  });
});

describe('glassesFilled', () => {
  it('conta copos de 250 ml cheios, sem passar do total desenhado', () => {
    expect(glassesFilled(0, 8)).toBe(0);
    expect(glassesFilled(600, 8)).toBe(2);
    expect(glassesFilled(5000, 8)).toBe(8);
  });
});

describe('spokenWater', () => {
  it('frase completa, com unidade por extenso', () => {
    expect(spokenWater(750, 2000)).toBe('Água: 750 mililitros de 2.000 mililitros.');
  });
});
