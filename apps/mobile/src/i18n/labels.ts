import i18n, { type ParseKeys } from 'i18next';

/**
 * Mapa de rótulos que traduz na hora da leitura: `GOAL_LABELS.lose` devolve o
 * texto do idioma em uso. Assim as listas de opções (objetivo, refeição,
 * atividade…) continuam sendo usadas como objeto simples, sem virar função em
 * cada tela, e seguem o idioma escolhido.
 */
export function translatedLabels<K extends string>(keys: Record<K, ParseKeys>): Record<K, string> {
  return new Proxy(keys, {
    get(target, property) {
      const key = target[property as K];
      return typeof key === 'string' ? i18n.t(key) : undefined;
    },
  }) as unknown as Record<K, string>;
}
