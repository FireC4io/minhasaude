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
  auth: {
    email: 'E-mail',
    password: 'Senha',
    signIn: 'Entrar',
    createAccount: 'Criar conta',
    forgotPassword: 'Esqueci minha senha',
    emailExample: 'Digite um e-mail válido, como maria@exemplo.com.',
    welcome: {
      tagline: 'Sua alimentação e sua saúde, num app fácil de usar.',
      foodTitle: 'Anote o que você come',
      foodText: 'Busque o alimento ou fale a refeição. O app faz a conta das calorias e nutrientes.',
      weightTitle: 'Acompanhe seu peso',
      weightText: 'Registre quando quiser e veja a evolução num gráfico simples.',
      examsTitle: 'Guarde seus exames',
      examsText: 'Exames de sangue e bioimpedância num só lugar, com a faixa do próprio laudo.',
      createMine: 'Criar minha conta',
      haveAccount: 'Já tenho conta',
      footer: 'Gratuito e sem anúncios. As informações do app não substituem a orientação de um profissional de saúde.',
    },
    login: {
      title: 'Bem-vindo de volta',
      fillBoth: 'Preencha o e-mail e a senha.',
      wrong: 'E-mail ou senha incorretos. Confira e tente de novo. Use “Mostrar senha” para ver o que digitou.',
      failed: 'Não foi possível entrar. Confira sua internet e tente de novo.',
    },
    register: {
      intro: 'Anote sua alimentação e acompanhe sua saúde num só lugar.',
      passwordMin: 'A senha precisa ter pelo menos {{min}} letras ou números.',
      passwordHint: 'Pelo menos {{min}} letras ou números',
      passwordRule: 'Use pelo menos {{min}} letras ou números.',
      passwordMissing: ' Faltam {{count}}.',
      exists: 'Já existe uma conta com este e-mail. Toque em “Entrar” logo abaixo.',
      failed: 'Não foi possível criar a conta. Confira sua internet e tente de novo.',
    },
    forgot: {
      preview: 'O envio do e-mail de recuperação ainda não existe no servidor. Nenhum e-mail será enviado.',
      intro: 'Digite o e-mail da sua conta. Vamos enviar um link para você criar uma senha nova.',
      invalidEmail: 'Digite o e-mail da sua conta, como maria@exemplo.com.',
      send: 'Enviar link',
      sentTitle: '✓ Pedido registrado',
      sentAnnounce: 'Pedido registrado. Confira sua caixa de entrada.',
      sentBody: 'Se houver uma conta com {{email}}, o link chega em alguns minutos. Confira também a caixa de spam. O link vale por 30 minutos e só pode ser usado uma vez.',
      back: 'Voltar para entrar',
    },
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
