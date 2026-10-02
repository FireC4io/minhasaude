import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';

import { FormError } from './form-error';

describe('FormError', () => {
  const originalOS = Platform.OS;

  // O preset do React Native já registra announceForAccessibility como um
  // jest.fn global: sem limpar, as chamadas de um teste vazam para o seguinte.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  it('não renderiza nada sem mensagem', async () => {
    await render(<FormError message={null} />);

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('é um alerta com região viva, para o TalkBack anunciar ao aparecer', async () => {
    await render(<FormError message="Email ou senha incorretos." />);

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Email ou senha incorretos.');
    expect(alerta).toHaveProp('accessibilityLiveRegion', 'polite');
  });

  it('no iOS anuncia explicitamente, porque o VoiceOver ignora a região viva', async () => {
    Platform.OS = 'ios';
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);

    await render(<FormError message="Não foi possível salvar." />);

    expect(announce).toHaveBeenCalledWith('Não foi possível salvar.');
  });

  it('no Android não anuncia por fora, para não falar duas vezes', async () => {
    Platform.OS = 'android';
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);

    await render(<FormError message="Não foi possível salvar." />);

    expect(announce).not.toHaveBeenCalled();
  });
});
