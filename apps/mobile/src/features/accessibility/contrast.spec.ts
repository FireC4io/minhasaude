import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { GotaVitalColors, type GotaVitalScheme } from '@/constants/gota-vital-colors';

import { contrastRatio, MIN_TEXT_CONTRAST } from './contrast';

type ColorName = keyof (typeof GotaVitalColors)['light'];

/**
 * Todo par texto/fundo que o app usa de verdade. Ao usar uma cor nova como
 * texto ou como fundo de botão, adicione o par aqui — se ele reprovar, a cor
 * precisa de uma variante `-forte` (ver F4-07 em docs/backlog-fase4.md).
 */
const TEXT_PAIRS: readonly (readonly [text: ColorName, background: ColorName])[] = [
  ['grafite', 'areia'],
  ['grafite', 'superficie'],
  ['grafiteSuave', 'areia'],
  ['grafiteSuave', 'superficie'],
  ['jabuticaba', 'areia'],
  ['jabuticaba', 'superficie'],
  ['mamaoForte', 'areia'],
  ['mamaoForte', 'superficie'],
  ['areia', 'mamaoForte'],
  ['maracujaForte', 'areia'],
  ['maracujaForte', 'superficie'],
];

describe('contrastRatio', () => {
  it('dá 21:1 para preto sobre branco', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('dá 1:1 para a mesma cor e é simétrico', () => {
    expect(contrastRatio('#ff6f4d', '#ff6f4d')).toBeCloseTo(1, 5);
    expect(contrastRatio('#2b3a34', '#fbf0e4')).toBeCloseTo(
      contrastRatio('#fbf0e4', '#2b3a34'),
      10,
    );
  });

  it('recusa hex fora do formato #rrggbb', () => {
    expect(() => contrastRatio('#fff', '#000000')).toThrow();
    expect(() => contrastRatio('vermelho', '#000000')).toThrow();
  });

  it('reproduz o achado do emulador: mamão original sobre areia reprova', () => {
    expect(contrastRatio(GotaVitalColors.light.mamao, GotaVitalColors.light.areia)).toBeLessThan(
      MIN_TEXT_CONTRAST,
    );
  });
});

describe.each(['light', 'dark'] as const)('paleta Gota Vital (%s)', (scheme: GotaVitalScheme) => {
  const palette = GotaVitalColors[scheme];

  it.each(TEXT_PAIRS)('%s sobre %s passa 4,5:1', (text, background) => {
    expect(contrastRatio(palette[text], palette[background])).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });
});

describe('global.css e gota-vital-colors.ts', () => {
  const css = readFileSync(join(__dirname, '../../global.css'), 'utf8');
  const [lightBlock = '', darkBlock = ''] = css.split('@media (prefers-color-scheme: dark)');

  const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const cssValue = (block: string, name: string) =>
    new RegExp(`--color-${kebab(name)}:\\s*(#[0-9a-f]{6})`, 'i').exec(block)?.[1]?.toLowerCase();

  it.each(Object.keys(GotaVitalColors.light))('%s tem o mesmo hex nas duas fontes', (name) => {
    expect(cssValue(lightBlock, name)).toBe(GotaVitalColors.light[name as ColorName]);
    expect(cssValue(darkBlock, name)).toBe(GotaVitalColors.dark[name as ColorName]);
  });
});
