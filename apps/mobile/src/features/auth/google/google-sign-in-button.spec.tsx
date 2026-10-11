import { render, screen, userEvent } from '@testing-library/react-native';

import { useAuth } from '@/features/auth/auth-context';

import { isGoogleSignInAvailable, requestGoogleIdToken } from './google-sign-in';
import { GoogleSignInSection } from './google-sign-in-section';

jest.mock('./google-sign-in');
jest.mock('@/features/auth/auth-context', () => ({ useAuth: jest.fn() }));

const available = jest.mocked(isGoogleSignInAvailable);
const requestToken = jest.mocked(requestGoogleIdToken);
const loginWithGoogle = jest.fn();

describe('Continuar com o Google', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    available.mockReturnValue(true);
    jest.mocked(useAuth).mockReturnValue({ loginWithGoogle } as unknown as ReturnType<typeof useAuth>);
  });

  it('some onde o login do Google não existe (Expo Go, web)', async () => {
    available.mockReturnValue(false);
    await render(<GoogleSignInSection />);
    expect(screen.queryByRole('button', { name: 'Continuar com o Google' })).toBeNull();
    expect(screen.queryByText('ou')).toBeNull();
  });

  it('manda o token do Google para entrar', async () => {
    requestToken.mockResolvedValue({ type: 'success', idToken: 'token-do-google' });
    loginWithGoogle.mockResolvedValue(undefined);
    await render(<GoogleSignInSection />);

    await userEvent.press(screen.getByRole('button', { name: 'Continuar com o Google' }));

    expect(loginWithGoogle).toHaveBeenCalledWith('token-do-google');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('desistir na escolha de conta não é erro', async () => {
    requestToken.mockResolvedValue({ type: 'cancelled' });
    await render(<GoogleSignInSection />);

    await userEvent.press(screen.getByRole('button', { name: 'Continuar com o Google' }));

    expect(loginWithGoogle).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('explica a falha e lembra que dá para usar e-mail e senha', async () => {
    requestToken.mockResolvedValue({ type: 'success', idToken: 'token' });
    loginWithGoogle.mockRejectedValue(new Error('401'));
    await render(<GoogleSignInSection />);

    await userEvent.press(screen.getByRole('button', { name: 'Continuar com o Google' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/use e-mail e senha/);
  });
});
