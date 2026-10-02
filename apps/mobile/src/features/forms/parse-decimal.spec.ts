import { parseDecimal } from './parse-decimal';

describe('parseDecimal', () => {
  it('aceita vírgula decimal, que é como se digita no Brasil', () => {
    expect(parseDecimal('69,2')).toBe(69.2);
  });

  it('continua aceitando ponto decimal', () => {
    expect(parseDecimal('69.2')).toBe(69.2);
  });

  it('ignora espaços nas pontas', () => {
    expect(parseDecimal(' 172 ')).toBe(172);
  });

  it('devolve NaN para campo vazio em vez de 0', () => {
    // `Number('')` é 0, o que passaria em validações do tipo "maior ou igual a 0".
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('   ')).toBeNaN();
  });

  it('devolve NaN para texto que não é número', () => {
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal('1,2,3')).toBeNaN();
  });
});
