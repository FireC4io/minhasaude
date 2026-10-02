import { render, screen, userEvent } from '@testing-library/react-native';

import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { TextButton } from './text-button';

describe('TextButton', () => {
  it('é um botão cujo nome é o texto visível por padrão', async () => {
    await render(<TextButton label="Sair" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy();
  });

  it('usa o nome falado quando o texto visível não significa nada sozinho', async () => {
    const onPress = jest.fn();
    await render(<TextButton label="‹" accessibilityLabel="Dia anterior" onPress={onPress} />);

    await userEvent.press(screen.getByRole('button', { name: 'Dia anterior' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('anuncia ocupado e não dispara enquanto a ação roda', async () => {
    const onPress = jest.fn();
    await render(<TextButton label="Copiando…" onPress={onPress} busy />);

    const botao = screen.getByRole('button', { name: 'Copiando…' });
    expect(botao).toBeBusy();
    expect(botao).toBeDisabled();

    await userEvent.press(botao);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('respeita o alvo de toque mínimo nas duas dimensões', async () => {
    await render(<TextButton label="›" accessibilityLabel="Próximo dia" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Próximo dia' })).toHaveStyle({
      minHeight: MIN_TOUCH_TARGET,
      minWidth: MIN_TOUCH_TARGET,
    });
  });

  // O NativeWind junta `className` e `style` num array, e o Pressable só chama
  // `style` quando ele é uma função — dentro do array a função é ignorada e o
  // alvo de toque some no app real. O Jest não roda o NativeWind, então o
  // `toHaveStyle` acima passa mesmo assim; esta checagem é o que trava a regressão.
  it('passa o estilo como objeto, nunca como função', () => {
    // Sem hooks no componente, dá para olhar o elemento que ele devolve.
    const element = TextButton({ label: 'Sair', onPress: jest.fn(), className: 'items-end' });

    expect(typeof element.props.style).toBe('object');
  });
});
