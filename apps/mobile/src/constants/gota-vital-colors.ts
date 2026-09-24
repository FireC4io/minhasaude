/**
 * Paleta "Gota Vital" em JS, espelhando os tokens de `src/global.css`.
 *
 * Existe porque `className` do NativeWind não alcança props imperativas —
 * `stroke`/`fill` de SVG, por exemplo. Ao mudar um hex aqui, mude também em
 * `global.css`: as duas fontes precisam continuar iguais.
 */
export const GotaVitalColors = {
  light: {
    areia: '#fbf0e4',
    grafite: '#2b3a34',
    mamao: '#ff6f4d',
    couve: '#3e8e5b',
    jabuticaba: '#8c2f4b',
    maracuja: '#c98a12',
  },
  dark: {
    areia: '#1e1712',
    grafite: '#f5eae0',
    mamao: '#ff8264',
    couve: '#63bf87',
    jabuticaba: '#e0839a',
    maracuja: '#f0bb4e',
  },
} as const;

export type GotaVitalScheme = keyof typeof GotaVitalColors;
