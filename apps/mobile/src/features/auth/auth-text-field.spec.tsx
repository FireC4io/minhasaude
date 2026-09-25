import { render, screen } from '@testing-library/react-native';

import { AuthTextField } from './auth-text-field';

describe('AuthTextField', () => {
  it('associa o rótulo visível ao campo', async () => {
    // O rótulo é um Text irmão: sem accessibilityLabel o leitor de tela
    // anunciaria só "campo de texto".
    await render(<AuthTextField label="Peso (kg)" value="" onChangeText={jest.fn()} />);

    expect(screen.getByLabelText('Peso (kg)')).toBeTruthy();
  });

  it('anuncia o erro como alerta, não só pinta de vermelho', async () => {
    await render(
      <AuthTextField
        label="Peso (kg)"
        value="999"
        onChangeText={jest.fn()}
        error="Informe um peso válido (entre 20 e 400 kg)."
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Informe um peso válido (entre 20 e 400 kg).',
    );
  });

  it('leva o erro também para a dica do campo', async () => {
    // Quem navega pelo campo precisa ouvir o erro ali, sem depender de
    // encontrar o texto solto abaixo.
    await render(
      <AuthTextField label="Email" value="x" onChangeText={jest.fn()} error="Email inválido" />,
    );

    expect(screen.getByLabelText('Email')).toHaveProp('accessibilityHint', 'Email inválido');
  });

  it('não renderiza alerta quando não há erro', async () => {
    await render(<AuthTextField label="Email" value="" onChangeText={jest.fn()} />);

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('mantém o valor digitado visível', async () => {
    await render(<AuthTextField label="Email" value="ana@exemplo.br" onChangeText={jest.fn()} />);

    expect(screen.getByLabelText('Email')).toHaveDisplayValue('ana@exemplo.br');
  });
});
