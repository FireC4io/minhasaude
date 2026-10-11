// Versão da política de privacidade que o onboarding faz o usuário aceitar.
// Bump manual sempre que o texto da política mudar de forma relevante —
// cada linha em `consents` é um evento imutável, então isso fica no
// histórico de auditoria (ver CLAUDE.md).
// Formato AAAA-MM: o app compara como texto para saber se o aceite é antigo.
export const CURRENT_PRIVACY_POLICY_VERSION = '2026-10';

/** Texto completo publicado (GitHub Pages, gerado de docs/legal/politica-de-privacidade.md). */
export const PRIVACY_POLICY_URL = 'https://firec4io.github.io/minhasaude/privacidade/';
