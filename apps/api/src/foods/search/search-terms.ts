/**
 * Termos da busca de alimento: normalização, sinônimos regionais e a forma
 * mais comum de cada alimento básico. A ordenação em si mora no SQL de
 * `food-search.query.ts`; aqui só o que dá para testar sem banco.
 */

export interface SearchTerms {
  /** Termo normalizado (sem acento, minúsculo), já com sinônimo trocado. */
  query: string;
  /** Palavras do termo: só `[a-z0-9]`, seguras para montar regex no SQL. */
  tokens: string[];
  /** Nomes exatos da TACO que vêm primeiro, na ordem. */
  preferred: string[];
}

// Nomes regionais que a TACO não usa.
const SYNONYMS: Record<string, string> = {
  aipim: 'mandioca',
  macaxeira: 'mandioca',
  jerimum: 'abobora',
  'pao de sal': 'pao frances',
  cacetinho: 'pao frances',
  'pao careca': 'pao frances',
};

/**
 * A forma do dia a dia de cada termo comum: quem busca "feijão" quase sempre
 * quer o carioca cozido, não "Baião de dois". Um teste confere cada nome
 * contra o CSV da TACO.
 */
export const PREFERRED_FOODS: Record<string, string[]> = {
  arroz: ['Arroz, tipo 1, cozido', 'Arroz, integral, cozido'],
  feijao: ['Feijão, carioca, cozido', 'Feijão, preto, cozido'],
  pao: ['Pão, trigo, francês', 'Pão, trigo, forma, integral'],
  'pao frances': ['Pão, trigo, francês'],
  banana: ['Banana, prata, crua', 'Banana, nanica, crua'],
  ovo: ['Ovo, de galinha, inteiro, cozido/10minutos', 'Ovo, de galinha, inteiro, frito'],
  frango: ['Frango, peito, sem pele, grelhado', 'Frango, peito, sem pele, cozido'],
  batata: ['Batata, inglesa, cozida'],
  cafe: ['Café, infusão 10%'],
  carne: ['Carne, bovina, patinho, sem gordura, grelhado'],
  mandioca: ['Mandioca, cozida'],
  acucar: ['Açúcar, refinado', 'Açúcar, cristal'],
  queijo: ['Queijo, minas, frescal', 'Queijo, mozarela'],
  iogurte: ['Iogurte, natural'],
  tomate: ['Tomate, com semente, cru'],
};

export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function buildSearchTerms(raw: string): SearchTerms {
  const normalized = normalizeSearchText(raw);
  const query = SYNONYMS[normalized] ?? normalized;
  return {
    query,
    tokens: query.split(' ').filter(Boolean),
    preferred: PREFERRED_FOODS[query] ?? [],
  };
}
