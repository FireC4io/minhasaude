import { render, screen, userEvent } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';

import { NewPasswordForm } from './new-password-form';
import { RequestCodeForm } from './request-code-form';

function httpError(status: number): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('erro', String(status), config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data: {},
  });
}

describe('RequestCodeForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('não envia sem um e-mail e diz o que falta', async () => {
    const onSubmit = jest.fn();
    await render(<RequestCodeForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('E-mail'), 'maria');
    await userEvent.press(screen.getByRole('button', { name: 'Enviar código' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Digite o e-mail da sua conta, como maria@exemplo.com.');
  });

  it('envia o e-mail sem espaços nas pontas', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(<RequestCodeForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('E-mail'), ' maria@exemplo.com ');
    await userEvent.press(screen.getByRole('button', { name: 'Enviar código' }));

    expect(onSubmit).toHaveBeenCalledWith('maria@exemplo.com');
  });

  it('avisa para esperar quando o servidor limita os pedidos', async () => {
    const onSubmit = jest.fn().mockRejectedValue(httpError(429));
    await render(<RequestCodeForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await userEvent.press(screen.getByRole('button', { name: 'Enviar código' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Espere um minuto/);
  });
});

describe('NewPasswordForm', () => {
  beforeEach(() => jest.clearAllMocks());

  const renderForm = (overrides: Partial<Parameters<typeof NewPasswordForm>[0]> = {}) =>
    render(
      <NewPasswordForm
        email="maria@exemplo.com"
        onSubmit={jest.fn()}
        onResend={jest.fn().mockResolvedValue(undefined)}
        onChangeEmail={jest.fn()}
        {...overrides}
      />,
    );

  it('diz para onde o código foi e por quanto tempo vale', async () => {
    await renderForm();
    expect(screen.getByText(/maria@exemplo\.com.*15 minutos/)).toBeTruthy();
  });

  it('aceita só números no código, até 6', async () => {
    await renderForm();
    const field = screen.getByLabelText('Código do e-mail');
    await userEvent.type(field, '12a 34-5678');
    expect(field.props.value).toBe('123456');
  });

  it('pede os 6 números antes de enviar', async () => {
    const onSubmit = jest.fn();
    await renderForm({ onSubmit });

    await userEvent.type(screen.getByLabelText('Código do e-mail'), '123');
    await userEvent.type(screen.getByLabelText('Senha nova'), 'SenhaNova123');
    await userEvent.press(screen.getByRole('button', { name: 'Criar senha nova' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Digite os 6 números do código que chegou no e-mail.');
  });

  it('pede senha com o tamanho mínimo', async () => {
    const onSubmit = jest.fn();
    await renderForm({ onSubmit });

    await userEvent.type(screen.getByLabelText('Código do e-mail'), '123456');
    await userEvent.type(screen.getByLabelText('Senha nova'), 'curta');
    await userEvent.press(screen.getByRole('button', { name: 'Criar senha nova' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia código e senha, e explica quando o código não serve', async () => {
    const onSubmit = jest.fn().mockRejectedValue(httpError(400));
    await renderForm({ onSubmit });

    await userEvent.type(screen.getByLabelText('Código do e-mail'), '123456');
    await userEvent.type(screen.getByLabelText('Senha nova'), 'SenhaNova123');
    await userEvent.press(screen.getByRole('button', { name: 'Criar senha nova' }));

    expect(onSubmit).toHaveBeenCalledWith('123456', 'SenhaNova123');
    expect(await screen.findByRole('alert')).toHaveTextContent(/errado, venceu ou já foi usado/);
  });

  it('manda outro código, limpa o campo e avisa que só o mais novo vale', async () => {
    const onResend = jest.fn().mockResolvedValue(undefined);
    await renderForm({ onResend });

    await userEvent.type(screen.getByLabelText('Código do e-mail'), '111111');
    await userEvent.press(screen.getByRole('button', { name: 'Mandar outro código' }));

    expect(onResend).toHaveBeenCalled();
    expect(screen.getByLabelText('Código do e-mail').props.value).toBe('');
    expect(await screen.findByText('Código novo enviado. Use só o mais recente.')).toBeTruthy();
  });

  it('deixa trocar o e-mail', async () => {
    const onChangeEmail = jest.fn();
    await renderForm({ onChangeEmail });
    await userEvent.press(screen.getByRole('button', { name: 'Usar outro e-mail' }));
    expect(onChangeEmail).toHaveBeenCalled();
  });
});
