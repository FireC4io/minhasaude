/**
 * Converte o texto de um campo numérico aceitando vírgula decimal ("69,2"),
 * que é como o público brasileiro digita — `Number('69,2')` é `NaN`, e o
 * formulário recusava um peso perfeitamente válido.
 *
 * Campo vazio vira `NaN`, não `0`, para não passar em validação de mínimo.
 */
export function parseDecimal(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') {
    return Number.NaN;
  }
  return Number(trimmed.replace(/,/g, '.'));
}
