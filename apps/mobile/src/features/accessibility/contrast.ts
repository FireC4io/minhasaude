/**
 * Contraste entre duas cores pela fórmula do WCAG 2.x, que a ABNT NBR 17060
 * adota. Usado para travar em teste que a paleta continua legível.
 */

/** Mínimo para texto de tamanho normal (WCAG 1.4.3, nível AA). */
export const MIN_TEXT_CONTRAST = 4.5;

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

function channelToLinear(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  if (!HEX_PATTERN.test(hex)) {
    throw new Error(`Cor fora do formato #rrggbb: ${hex}`);
  }
  const channel = (start: number) => channelToLinear(parseInt(hex.slice(start, start + 2), 16));
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
