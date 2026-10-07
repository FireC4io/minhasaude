import { render, screen, userEvent } from '@testing-library/react-native';

import { RadioList } from './radio-list';

const OPTIONS = [
  { value: 'light', label: 'Levemente ativo', description: 'Caminha um pouco no dia a dia' },
  { value: 'active', label: 'Ativo', description: 'Treina quase todo dia' },
] as const;

describe('RadioList', () => {
  it('cada opção é um radio com rótulo e exemplo no nome falado', async () => {
    await render(
      <RadioList label="Atividade" options={OPTIONS} value={null} onChange={jest.fn()} />,
    );

    expect(
      screen.getByRole('radio', { name: 'Levemente ativo. Caminha um pouco no dia a dia' }),
    ).toBeTruthy();
  });

  it('marca a escolhida com estado e com sinal visível, não só cor', async () => {
    await render(
      <RadioList label="Atividade" options={OPTIONS} value="active" onChange={jest.fn()} />,
    );

    expect(screen.getByRole('radio', { name: /^Ativo/ })).toBeChecked();
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('avisa a escolha', async () => {
    const onChange = jest.fn();
    await render(<RadioList label="Atividade" options={OPTIONS} value={null} onChange={onChange} />);

    await userEvent.press(screen.getByRole('radio', { name: /^Ativo/ }));

    expect(onChange).toHaveBeenCalledWith('active');
  });
});
