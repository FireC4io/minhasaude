import {
  describeDiaryEntry,
  describeMealHeader,
  describeSearchStatus,
} from './accessibility-labels';

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
