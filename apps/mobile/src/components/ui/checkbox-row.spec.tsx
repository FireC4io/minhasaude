import { render, screen, userEvent } from '@testing-library/react-native';

import { CheckboxRow } from './checkbox-row';

describe('CheckboxRow', () => {
  it('é uma caixa de seleção com o texto como nome e estado anunciado', async () => {
    await render(<CheckboxRow label="Entendi" checked={false} onChange={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Entendi' })).not.toBeChecked();
  });

  it('inverte o estado ao tocar', async () => {
    const onChange = jest.fn();
    await render(<CheckboxRow label="Entendi" checked onChange={onChange} />);

    expect(screen.getByRole('checkbox', { name: 'Entendi' })).toBeChecked();
    await userEvent.press(screen.getByRole('checkbox', { name: 'Entendi' }));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
