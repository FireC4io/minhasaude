/**
 * Textos da interface em português — a FONTE. `en.ts` e `es.ts` são tipados a
 * partir daqui (`Translations`): chave faltando lá quebra o build.
 *
 * Linguagem simples (F4-12): palavras do dia a dia, siglas explicadas, frases
 * curtas. Texto de saúde é informativo, nunca diagnóstico (RDC 657/2022).
 * Interpolação: {{nome}}. Plural: chaves _one/_other (Intl.PluralRules).
 */
export const ptBR = {
  language: {
    label: 'Idioma',
    system: 'Igual ao celular',
    hint: 'Os nomes dos alimentos continuam em português: vêm da tabela brasileira TACO.',
  },
};

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Translations = Widen<typeof ptBR>;
