import { GotaVitalColors } from '@/constants/gota-vital-colors';

import { paletteCssVars } from './theme-vars';

describe('paletteCssVars', () => {
  it('converte cada cor da paleta na variável CSS que o tailwind.config lê', () => {
    const cssVars = paletteCssVars('light');

    expect(cssVars['--color-areia']).toBe(GotaVitalColors.light.areia);
    expect(cssVars['--color-mamao-forte']).toBe(GotaVitalColors.light.mamaoForte);
    expect(cssVars['--color-maracuja-forte']).toBe(GotaVitalColors.light.maracujaForte);
  });

  it('usa a variante escura quando pedido', () => {
    expect(paletteCssVars('dark')['--color-grafite']).toBe(GotaVitalColors.dark.grafite);
  });

  it('cobre todas as cores da paleta, sem sobras', () => {
    expect(Object.keys(paletteCssVars('dark'))).toHaveLength(
      Object.keys(GotaVitalColors.dark).length,
    );
  });
});
