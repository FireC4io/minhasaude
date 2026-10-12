import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RegisterScreen from '@/app/(auth)/register';
import { useAuth } from '@/features/auth/auth-context';

const mockRegister = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }) }));
jest.mock('@/features/auth/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/auth/google/google-sign-in-section', () => ({ GoogleSignInSection: () => null }));

const METRICS = { frame: { x: 0, y: 0, width: 400, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

function renderRegister() {
  jest.mocked(useAuth).mockReturnValue({ register: mockRegister } as never);
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <RegisterScreen />
    </SafeAreaProvider>,
  );
}

describe('criar conta', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mostra quantas letras faltam e não cria com senha curta', async () => {
    await renderRegister();
    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'abc');

    expect(screen.getByText(/Faltam 5\./)).toBeOnTheScreen();
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.getByText('A senha precisa ter pelo menos 8 letras ou números.')).toBeOnTheScreen();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('cria a conta com o e-mail sem espaços', async () => {
    mockRegister.mockResolvedValue(undefined);
    await renderRegister();
    await userEvent.type(screen.getByLabelText('E-mail'), ' maria@exemplo.com ');
    await userEvent.type(screen.getByLabelText('Senha'), 'SenhaForte1');
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));

    expect(mockRegister).toHaveBeenCalledWith('maria@exemplo.com', 'SenhaForte1');
  });

  it('e-mail já cadastrado manda entrar', async () => {
    mockRegister.mockRejectedValue(Object.assign(new Error('conflito'), { isAxiosError: true, response: { status: 409 } }));
    await renderRegister();
    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'SenhaForte1');
    await userEvent.press(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText(/Já existe uma conta com este e-mail/)).toBeOnTheScreen();
  });
});
