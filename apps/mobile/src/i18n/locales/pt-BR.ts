/**
 * Textos da interface em português — a FONTE. `en.ts` e `es.ts` são tipados a
 * partir daqui (`Translations`): chave faltando lá quebra o build.
 *
 * Linguagem simples (F4-12): palavras do dia a dia, siglas explicadas, frases
 * curtas. Texto de saúde é informativo, nunca diagnóstico (RDC 657/2022).
 * Interpolação: {{nome}}. Plural: chaves _one/_other (Intl.PluralRules).
 */
export const ptBR = {
  common: {
    tryAgain: 'Tentar de novo',
    close: 'Fechar',
    previewTitle: 'Prévia — dados de demonstração',
    connecting: 'Conectando ao servidor…',
    connectingHint: 'Na primeira vez do dia pode levar até um minuto. O que já estava na tela continua aqui.',
    showPassword: 'Mostrar senha',
    hidePassword: 'Esconder senha',
  },
  tabs: { today: 'Hoje', progress: 'Progresso', exams: 'Exames', profile: 'Perfil' },
  goalUnavailable: {
    title: 'Não foi possível carregar',
    body: 'Não conseguimos buscar sua meta agora. Seus dados continuam salvos. Tente de novo quando a internet voltar.',
  },
  units: {
    kcal: { one: 'quilocaloria', other: 'quilocalorias' },
    gram: { one: 'grama', other: 'gramas' },
    kilo: { one: 'quilo', other: 'quilos' },
  },
  language: {
    label: 'Idioma',
    system: 'Igual ao celular',
    hint: 'Os nomes dos alimentos continuam em português: vêm da tabela brasileira TACO.',
  },
};

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Translations = Widen<typeof ptBR>;
