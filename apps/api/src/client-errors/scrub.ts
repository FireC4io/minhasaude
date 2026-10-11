const EMAIL = /[^\s@"'<>()]+@[^\s@"'<>()]+\.[^\s@"'<>()]+/g;
const JWT = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;

/**
 * Mensagem de erro do app pode carregar, por acaso, o e-mail da pessoa ou um
 * token. Antes de ir para o log, os dois viram marcadores.
 */
export function scrub(text: string): string {
  return text.replace(JWT, '[token]').replace(EMAIL, '[email]');
}
