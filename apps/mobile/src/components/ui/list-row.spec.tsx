import { render, screen, userEvent } from '@testing-library/react-native';

import { MIN_TOUCH_TARGET } from '@/constants/accessibility';

import { ListRow } from './list-row';

describe('ListRow', () => {
  it('é um botão cujo nome junta título e descrição', async () => {
    await render(
      <ListRow title="Exportar meus dados" description="Arquivo com tudo o que guardamos" onPress={jest.fn()} />,
    );

    expect(
      screen.getByRole('button', { name: 'Exportar meus dados. Arquivo com tudo o que guardamos' }),
    ).toBeTruthy();
  });

  it('dispara onPress e respeita o alvo mínimo', async () => {
    const onPress = jest.fn();
    await render(<ListRow title="Sobre" onPress={onPress} />);

    const row = screen.getByRole('button', { name: 'Sobre' });
    expect(row).toHaveStyle({ minHeight: MIN_TOUCH_TARGET });
    await userEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('a variante de perigo não depende só da cor: o título já diz a ação', async () => {
    await render(<ListRow title="Excluir minha conta" tone="danger" onPress={jest.fn()} />);

    expect(screen.getByText('Excluir minha conta').props.className).toContain('text-jabuticaba');
  });
});
