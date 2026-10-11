import { ageInYears, isAdult } from './age';

describe('idade mínima', () => {
  const today = new Date(2026, 9, 10); // 10/10/2026

  it('faz 18 hoje: pode usar', () => {
    expect(ageInYears('2008-10-10', today)).toBe(18);
    expect(isAdult('2008-10-10', today)).toBe(true);
  });

  it('faz 18 amanhã: ainda não pode', () => {
    expect(ageInYears('2008-10-11', today)).toBe(17);
    expect(isAdult('2008-10-11', today)).toBe(false);
  });

  it('data inválida não conta como adulto', () => {
    expect(ageInYears('2001-02-30', today)).toBeNull();
    expect(isAdult('abc', today)).toBe(false);
  });

  it('adulto comum', () => {
    expect(isAdult('1992-03-15', today)).toBe(true);
  });
});
