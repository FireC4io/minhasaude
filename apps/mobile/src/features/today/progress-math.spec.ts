import { caloriesStatus, macroValue, progressFraction } from './progress-math';

describe('progressFraction', () => {
  it('é a parte consumida da meta, entre 0 e 1', () => {
    expect(progressFraction(500, 2000)).toBe(0.25);
    expect(progressFraction(2500, 2000)).toBe(1);
    expect(progressFraction(-10, 2000)).toBe(0);
  });

  it('sem meta (ou meta zero) não desenha progresso', () => {
    expect(progressFraction(500, null)).toBe(0);
    expect(progressFraction(500, 0)).toBe(0);
  });
});

describe('caloriesStatus', () => {
  it('diz quanto falta, arredondado', () => {
    expect(caloriesStatus(1200.4, 2086)).toBe('Faltam 886 kcal');
  });

  it('acima da meta é informado sem julgamento', () => {
    expect(caloriesStatus(2300, 2086)).toBe('214 kcal acima da meta');
  });

  it('meta exata', () => {
    expect(caloriesStatus(2086, 2086)).toBe('Meta do dia atingida');
  });

  it('sem meta, convida a calcular', () => {
    expect(caloriesStatus(300, null)).toBe('Calcule sua meta no Perfil para ver quanto falta');
  });
});

describe('macroValue', () => {
  it('restante, em gramas', () => {
    expect(macroValue('remaining', 40, 100)).toBe('60 g faltando');
  });

  it('restante não fica negativo: mostra quanto passou', () => {
    expect(macroValue('remaining', 120, 100)).toBe('20 g acima');
  });

  it('consumido, com a meta', () => {
    expect(macroValue('consumed', 40.6, 100)).toBe('41 de 100 g');
  });

  it('porcentagem da meta', () => {
    expect(macroValue('percent', 40, 160)).toBe('25%');
  });

  it('sem meta, sempre o consumido', () => {
    expect(macroValue('percent', 40, null)).toBe('40 g');
    expect(macroValue('remaining', 40, null)).toBe('40 g');
  });
});

// O leitor de tela soletra "kcal" e lê "g" como letra: o rótulo falado usa a
// unidade por extenso, e a tela continua com a sigla (testes acima).
describe('unidade falada', () => {
  it('calorias por extenso, com plural', () => {
    expect(caloriesStatus(1200.4, 2086, 'spoken')).toBe('Faltam 886 quilocalorias');
    expect(caloriesStatus(2087, 2086, 'spoken')).toBe('1 quilocaloria acima da meta');
  });

  it('gramas por extenso em todos os modos', () => {
    expect(macroValue('remaining', 40, 100, 'spoken')).toBe('60 gramas faltando');
    expect(macroValue('remaining', 120, 100, 'spoken')).toBe('20 gramas acima');
    expect(macroValue('consumed', 40.6, 100, 'spoken')).toBe('41 de 100 gramas');
    expect(macroValue('remaining', 1, null, 'spoken')).toBe('1 grama');
  });
});
