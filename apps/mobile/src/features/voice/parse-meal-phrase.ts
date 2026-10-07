/**
 * Interpreta uma frase falada ou digitada ("150 gramas de arroz e um bife")
 * em itens. Regras simples, sem IA: resolve o comum e deixa o resto para a
 * revisão — que é obrigatória antes de salvar, com ou sem IA.
 */

export interface ParsedItem {
  foodName: string;
  /** Gramas ditas explicitamente ("150 g", "meio quilo"). */
  grams: number | null;
  /** Unidades ("um bife", "duas bananas") — a pessoa define as gramas na revisão. */
  count: number | null;
}

const NUMBER_WORDS: Record<string, number> = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  três: 3,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  meio: 0.5,
  meia: 0.5,
};

const LEADING_VERBS =
  /^(eu\s+)?(comi|almocei|jantei|lanchei|tomei|bebi|merendei|tomei café com|no café comi)\s+/i;

const QUANTITY = /^(\d+(?:[.,]\d+)?|um|uma|dois|duas|três|tres|quatro|cinco|seis|meio|meia)\s+/i;
const UNIT = /^(gramas?|g|quilos?|kg)\s+(de\s+)?/i;

function parseItem(raw: string): ParsedItem | null {
  let text = raw.trim().replace(LEADING_VERBS, '').trim();
  if (!text) return null;

  const quantityMatch = QUANTITY.exec(text);
  if (!quantityMatch?.[1]) return { foodName: text, grams: null, count: null };

  const word = quantityMatch[1].toLowerCase();
  const amount = NUMBER_WORDS[word] ?? Number(word.replace(',', '.'));
  text = text.slice(quantityMatch[0].length);

  const unitMatch = UNIT.exec(text);
  if (unitMatch?.[1]) {
    const isKilo =
      unitMatch[1].toLowerCase().startsWith('k') || unitMatch[1].toLowerCase().startsWith('q');
    return {
      foodName: text.slice(unitMatch[0].length).trim(),
      grams: Math.round(amount * (isKilo ? 1000 : 1)),
      count: null,
    };
  }

  // "15g de" grudado no número.
  const glued = /^g\s+(de\s+)?/i.exec(text);
  if (glued) return { foodName: text.slice(glued[0].length).trim(), grams: amount, count: null };

  return { foodName: text.replace(/^de\s+/i, '').trim(), grams: null, count: amount };
}

export function parseMealPhrase(phrase: string): ParsedItem[] {
  return phrase
    .replace(/(\d)\s*g\b/gi, '$1 g')
    .split(/,|;|\s+e\s+|\s+mais\s+/i)
    .map(parseItem)
    .filter((item): item is ParsedItem => item !== null && item.foodName.length > 0);
}
