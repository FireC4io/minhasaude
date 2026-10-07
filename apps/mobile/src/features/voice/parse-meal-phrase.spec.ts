import { parseMealPhrase } from './parse-meal-phrase';

describe('parseMealPhrase', () => {
  it('separa itens por vírgula e "e", com gramas explícitas', () => {
    expect(parseMealPhrase('150 gramas de arroz, 100g de feijão e um bife')).toEqual([
      { foodName: 'arroz', grams: 150, count: null },
      { foodName: 'feijão', grams: 100, count: null },
      { foodName: 'bife', grams: null, count: 1 },
    ]);
  });

  it('entende números por extenso e quilos', () => {
    expect(parseMealPhrase('duas bananas e meio quilo de melancia')).toEqual([
      { foodName: 'bananas', grams: null, count: 2 },
      { foodName: 'melancia', grams: 500, count: null },
    ]);
  });

  it('tira o verbo do começo da frase', () => {
    expect(parseMealPhrase('Almocei 200 g de frango grelhado')).toEqual([
      { foodName: 'frango grelhado', grams: 200, count: null },
    ]);
  });

  it('item sem quantidade fica para a pessoa preencher', () => {
    expect(parseMealPhrase('comi pão com manteiga')).toEqual([
      { foodName: 'pão com manteiga', grams: null, count: null },
    ]);
  });

  it('frase vazia não gera item', () => {
    expect(parseMealPhrase('   ')).toEqual([]);
  });
});
