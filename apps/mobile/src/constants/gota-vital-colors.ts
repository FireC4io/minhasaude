/**
 * Paleta "Gota Vital" em JS, espelhando os tokens de `src/global.css`.
 *
 * Existe porque `className` do NativeWind não alcança props imperativas —
 * `stroke`/`fill` de SVG, por exemplo. Ao mudar um hex aqui, mude também em
 * `global.css`: as duas fontes precisam continuar iguais (há teste para isso
 * em `features/accessibility/contrast.spec.ts`).
 *
 * `mamaoForte`/`maracujaForte` são as variantes para texto e fundo de botão:
 * o mamão e o maracujá originais não passam 4,5:1 sobre a areia no modo
 * claro e ficam só para áreas grandes e decorativas (F4-07). No escuro as
 * originais já passam, então as duas variantes repetem o mesmo hex.
 */
export const GotaVitalColors = {
  light: {
    areia: '#fbf0e4',
    superficie: '#ffffff',
    grafite: '#2b3a34',
    grafiteSuave: '#5f6e67',
    mamao: '#ff6f4d',
    mamaoForte: '#b8481f',
    couve: '#3e8e5b',
    jabuticaba: '#8c2f4b',
    maracuja: '#c98a12',
    maracujaForte: '#91630d',
  },
  dark: {
    areia: '#1e1712',
    superficie: '#2a211b',
    grafite: '#f5eae0',
    grafiteSuave: '#a39a90',
    mamao: '#ff8264',
    mamaoForte: '#ff8264',
    couve: '#63bf87',
    jabuticaba: '#e0839a',
    maracuja: '#f0bb4e',
    maracujaForte: '#f0bb4e',
  },
} as const;

export type GotaVitalScheme = keyof typeof GotaVitalColors;
