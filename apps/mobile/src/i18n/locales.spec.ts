import { en } from './locales/en';
import { es } from './locales/es';
import { ptBR } from './locales/pt-BR';

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ''): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [[`${prefix}${key}`, value]] : leaves(value, `${prefix}${key}.`),
  );
}

const variables = (text: string): string[] =>
  [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1] ?? '').sort();

describe('traduções', () => {
  const pt = new Map(leaves(ptBR as Tree));

  it.each([
    ['en', en],
    ['es', es],
  ] as const)('%s: nenhum texto vazio e as mesmas variáveis do português', (_name, locale) => {
    for (const [key, text] of leaves(locale as Tree)) {
      expect({ key, empty: text.trim() === '' }).toEqual({ key, empty: false });
      expect({ key, vars: variables(text) }).toEqual({ key, vars: variables(pt.get(key) ?? '') });
    }
  });

  it('português também não tem texto vazio', () => {
    for (const [key, text] of pt) {
      expect({ key, empty: text.trim() === '' }).toEqual({ key, empty: false });
    }
  });
});
