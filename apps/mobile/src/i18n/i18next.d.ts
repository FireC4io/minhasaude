import 'i18next';

import type { ptBR } from './locales/pt-BR';

// Chave inexistente em t('...') vira erro de tipo.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof ptBR };
  }
}
