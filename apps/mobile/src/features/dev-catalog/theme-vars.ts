import { GotaVitalColors, type GotaVitalScheme } from '@/constants/gota-vital-colors';

type CssVarName = `--color-${string}`;

const toKebab = (name: string): string => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Variáveis CSS de um tema, no formato que o `vars()` do NativeWind aceita.
 * Aplicadas num `View`, fazem a subárvore usar aquele tema independente do
 * modo do aparelho — é o que deixa o catálogo mostrar claro e escuro juntos.
 */
export function paletteCssVars(scheme: GotaVitalScheme): Record<CssVarName, string> {
  return Object.fromEntries(
    Object.entries(GotaVitalColors[scheme]).map(([name, hex]) => [`--color-${toKebab(name)}`, hex]),
  ) as Record<CssVarName, string>;
}
