import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PREFERRED_FOODS, buildSearchTerms, normalizeSearchText } from './search-terms';

describe('normalizeSearchText', () => {
  it('tira acento, caixa, pontuação e espaço sobrando', () => {
    expect(normalizeSearchText('  Pão,   FRANCÊS! ')).toBe('pao frances');
  });

  it('não deixa passar caractere de expressão regular', () => {
    expect(normalizeSearchText('arroz.*(|)[]$^')).toBe('arroz');
  });
});

describe('buildSearchTerms', () => {
  it('separa as palavras do termo', () => {
    expect(buildSearchTerms('Pão francês')).toEqual({
      query: 'pao frances',
      tokens: ['pao', 'frances'],
      preferred: ['Pão, trigo, francês'],
    });
  });

  it('troca sinônimo regional pelo nome da TACO', () => {
    expect(buildSearchTerms('Macaxeira').query).toBe('mandioca');
    expect(buildSearchTerms('aipim').preferred).toEqual(['Mandioca, cozida']);
    expect(buildSearchTerms('pão de sal').query).toBe('pao frances');
  });

  it('termo sem forma padrão não tem preferidos', () => {
    expect(buildSearchTerms('jabuticaba').preferred).toEqual([]);
  });
});

describe('PREFERRED_FOODS', () => {
  // Nome errado aqui não quebra nada, só some em silêncio da ordenação.
  it('todo nome padrão existe na TACO', () => {
    const taco = readFileSync(join(__dirname, '../../database/seeds/data/taco.csv'), 'utf8');
    const missing = Object.values(PREFERRED_FOODS)
      .flat()
      .filter((name) => !taco.includes(name));
    expect(missing).toEqual([]);
  });
});
