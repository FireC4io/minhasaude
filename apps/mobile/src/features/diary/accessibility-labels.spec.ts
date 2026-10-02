import {
  describeDiaryEntry,
  describeMacroSummary,
  describeMealHeader,
  describeSearchStatus,
} from './accessibility-labels';

const CONSUMED = { kcal: 1200.4, proteinG: 50.2, fatG: 40, carbG: 150.7 };
const TARGET = { kcal: 2480, proteinG: 120, fatG: 70, carbG: 300 };

describe('describeDiaryEntry', () => {
  it('junta a linha inteira numa frase só, em vez de célula por célula', () => {
    expect(
      describeDiaryEntry({ foodName: 'Banana, prata, crua', quantity: '130', kcal: '127.6' }),
    ).toBe('Banana, prata, crua, 130 gramas, 128 quilocalorias');
  });
});

describe('describeMealHeader', () => {
  it('diz o total da refeição quando há alimentos', () => {
    expect(describeMealHeader('Almoço', 3, 640.2)).toBe('Almoço, 3 alimentos, 640 quilocalorias');
  });

  it('usa singular com um alimento só', () => {
    expect(describeMealHeader('Jantar', 1, 300)).toBe('Jantar, 1 alimento, 300 quilocalorias');
  });

  it('avisa que a refeição está vazia', () => {
    expect(describeMealHeader('Lanche', 0, 0)).toBe('Lanche, nenhum alimento registrado');
  });
});

describe('describeMacroSummary', () => {
  it('lê consumido, meta e quanto falta', () => {
    const remaining = { kcal: 1279.6, proteinG: 69.8, fatG: 30, carbG: 149.3 };

    expect(describeMacroSummary(CONSUMED, TARGET, remaining)).toBe(
      'Consumido: 1.200 de 2.480 quilocalorias, faltam 1.280. ' +
        'Proteína: 50 de 120 gramas. Gordura: 40 de 70 gramas. Carboidrato: 151 de 300 gramas.',
    );
  });

  it('diz que passou da meta em vez de ler um número negativo', () => {
    const remaining = { kcal: -150, proteinG: 0, fatG: 0, carbG: 0 };

    expect(describeMacroSummary(CONSUMED, TARGET, remaining)).toMatch(
      /^Consumido: 1\.200 de 2\.480 quilocalorias, 150 acima da meta\./,
    );
  });

  it('sem meta calculada, lê só o consumido e diz que a meta falta', () => {
    expect(describeMacroSummary(CONSUMED, null, null)).toBe(
      'Consumido: 1.200 quilocalorias. Meta ainda não calculada. ' +
        'Proteína: 50 gramas. Gordura: 40 gramas. Carboidrato: 151 gramas.',
    );
  });
});

describe('describeSearchStatus', () => {
  it('fica em silêncio antes de 2 letras e enquanto a busca roda', () => {
    expect(describeSearchStatus('a', false, 0)).toBeNull();
    expect(describeSearchStatus('banana', true, 0)).toBeNull();
  });

  it('diz quantos alimentos vieram, com plural certo', () => {
    expect(describeSearchStatus('banana', false, 8)).toBe('8 alimentos encontrados.');
    expect(describeSearchStatus('banana', false, 1)).toBe('1 alimento encontrado.');
  });

  it('avisa quando a busca não achou nada', () => {
    expect(describeSearchStatus('xyz', false, 0)).toBe('Nenhum alimento encontrado.');
  });
});
