import { render, screen } from '@testing-library/react-native';

import { APP_FONTS } from '@/constants/typography';

import { AppText, TEXT_VARIANTS, type TextVariant } from './app-text';

// O tailwind.config é CommonJS sem tipos; `import` exigiria allowJs só para este teste.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwindConfig = require('../../../tailwind.config.js') as {
  theme: { extend: { fontFamily: Record<string, string[]> } };
};

describe('AppText', () => {
  it('usa o corpo de texto por padrão', async () => {
    await render(<AppText className="text-grafite">Olá</AppText>);

    expect(screen.getByText('Olá').props.className).toContain(TEXT_VARIANTS.body);
  });

  it('junta a classe da variante com a do chamador (cor, alinhamento)', async () => {
    await render(
      <AppText variant="title" className="text-center text-grafite">
        Diário
      </AppText>,
    );

    const className: string = screen.getByText('Diário').props.className;
    expect(className).toContain(TEXT_VARIANTS.title);
    expect(className).toContain('text-center text-grafite');
  });

  it('repassa as props de acessibilidade', async () => {
    await render(
      <AppText variant="title" accessibilityRole="header">
        Peso
      </AppText>,
    );

    expect(screen.getByRole('header', { name: 'Peso' })).toBeTruthy();
  });

  // No Android, `fontWeight` junto de uma família customizada faz o sistema
  // trocar para a fonte padrão: o peso tem de vir da própria família.
  it.each(Object.entries(TEXT_VARIANTS))('%s não usa font-weight', (_variant, classes) => {
    expect(classes).not.toMatch(/\bfont-(thin|light|normal|medium|semibold|bold|black)\b/);
  });

  it.each(Object.keys(TEXT_VARIANTS) as TextVariant[])(
    '%s aponta para uma fonte que o app carrega',
    (variant) => {
      const family = /\bfont-([a-z-]+)/.exec(TEXT_VARIANTS[variant])?.[1] ?? '';
      const fontName = tailwindConfig.theme.extend.fontFamily[family]?.[0] ?? '';

      expect(Object.keys(APP_FONTS)).toContain(fontName);
    },
  );
});
