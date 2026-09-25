import { render, screen, userEvent } from '@testing-library/react-native';

import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { PrimaryButton } from './primary-button';

// RTL 14: `render` é assíncrono. Ver CLAUDE.md — chamar sem `await` devolve uma
// Promise e produz o enganoso "getByText is not a function".

describe('PrimaryButton', () => {
  it('é anunciado como botão, com o rótulo como nome', async () => {
    await render(<PrimaryButton label="Entrar" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
  });

  it('dispara onPress ao ser tocado', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Entrar" onPress={onPress} />);

    await userEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('continua tendo nome enquanto carrega, mesmo sem texto na tela', async () => {
    // Durante o loading o rótulo some e sobra o spinner: sem accessibilityLabel
    // o leitor de tela anunciaria um botão anônimo.
    await render(<PrimaryButton label="Entrar" onPress={jest.fn()} isLoading />);

    const botao = screen.getByRole('button', { name: 'Entrar' });

    expect(botao).toBeTruthy();
    expect(screen.queryByText('Entrar')).toBeNull();
  });

  it('anuncia estado ocupado enquanto carrega', async () => {
    await render(<PrimaryButton label="Salvar" onPress={jest.fn()} isLoading />);

    const botao = screen.getByRole('button', { name: 'Salvar' });

    expect(botao).toBeBusy();
    expect(botao).toBeDisabled();
  });

  it('anuncia estado desabilitado e não dispara onPress', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Salvar" onPress={onPress} disabled />);

    const botao = screen.getByRole('button', { name: 'Salvar' });
    expect(botao).toBeDisabled();

    await userEvent.press(botao);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('expõe a dica quando a ação não é óbvia pelo rótulo', async () => {
    await render(
      <PrimaryButton label="Continuar" onPress={jest.fn()} hint="Calcula sua meta diária" />,
    );

    expect(screen.getByRole('button', { name: 'Continuar' })).toHaveProp(
      'accessibilityHint',
      'Calcula sua meta diária',
    );
  });

  it('respeita o alvo de toque mínimo', async () => {
    await render(<PrimaryButton label="Entrar" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveStyle({
      minHeight: MIN_TOUCH_TARGET,
    });
  });
});
