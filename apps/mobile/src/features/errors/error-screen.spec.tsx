import { render, screen, userEvent } from '@testing-library/react-native';

import { ErrorScreen } from './error-screen';

describe('ErrorScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('avisa em linguagem simples, tenta de novo e reporta o erro uma vez', async () => {
    const reporter = { report: jest.fn().mockResolvedValue(undefined) };
    const retry = jest.fn().mockResolvedValue(undefined);
    const error = new Error('quebrou');

    await render(<ErrorScreen error={error} retry={retry} reporter={reporter} />);

    expect(screen.getByRole('header')).toHaveTextContent('Algo deu errado nesta tela');
    expect(screen.getByText(/Seus dados continuam guardados/)).toBeOnTheScreen();
    expect(reporter.report).toHaveBeenCalledTimes(1);
    expect(reporter.report).toHaveBeenCalledWith(error, { fatal: true });

    await userEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
