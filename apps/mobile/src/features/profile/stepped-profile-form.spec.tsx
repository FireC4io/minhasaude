import { render, screen, userEvent } from '@testing-library/react-native';
import i18n from 'i18next';

import { SteppedProfileForm } from './stepped-profile-form';

describe('SteppedProfileForm', () => {
  it('mostra um assunto por vez, com o passo atual', async () => {
    await render(<SteppedProfileForm isSubmitting={false} onSubmit={jest.fn()} />);

    expect(screen.getByText('Passo 1 de 4')).toBeTruthy();
    expect(screen.getByLabelText('Data de nascimento')).toBeTruthy();
    expect(screen.queryByText('Objetivo')).toBeNull();
  });

  it('não avança sem preencher, e diz o que falta', async () => {
    await render(<SteppedProfileForm isSubmitting={false} onSubmit={jest.fn()} />);

    await userEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByText('Passo 1 de 4')).toBeTruthy();
    expect(screen.getByRole('alert')).toHaveTextContent(/data de nascimento/i);
  });

  it('percorre os passos e envia o perfil completo no final', async () => {
    const onSubmit = jest.fn();
    await render(<SteppedProfileForm isSubmitting={false} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Data de nascimento'), '20051996');
    await userEvent.type(screen.getByLabelText('Altura (cm)'), '165');
    await userEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    await userEvent.press(screen.getByRole('radio', { name: 'Feminino' }));
    await userEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    await userEvent.press(screen.getByRole('radio', { name: /^Moderadamente ativo/ }));
    await userEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByText('Passo 4 de 4')).toBeTruthy();
    await userEvent.press(screen.getByRole('radio', { name: 'Emagrecer' }));
    await userEvent.press(screen.getByRole('button', { name: 'Calcular minha meta' }));

    expect(onSubmit).toHaveBeenCalledWith({
      birthDate: '1996-05-20',
      heightCm: 165,
      sex: 'female',
      activityLevel: 'moderate',
      goal: 'lose',
      // A opção mais leve vem marcada ao escolher emagrecer.
      weeklyPaceKg: 0.25,
    });
  });

  async function goToLastStep(): Promise<void> {
    await userEvent.type(screen.getByLabelText('Data de nascimento'), '20051996');
    await userEvent.type(screen.getByLabelText('Altura (cm)'), '165');
    await userEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.press(screen.getByRole('radio', { name: 'Feminino' }));
    await userEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.press(screen.getByRole('radio', { name: /^Moderadamente ativo/ }));
    await userEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  }

  it('ritmo semanal: aparece para emagrecer e envia o escolhido', async () => {
    const onSubmit = jest.fn();
    await render(<SteppedProfileForm isSubmitting={false} onSubmit={onSubmit} />);
    await goToLastStep();

    expect(screen.queryByText('Quanto quer perder por semana?')).toBeNull();
    await userEvent.press(screen.getByRole('radio', { name: 'Emagrecer' }));
    expect(screen.getByText('Quanto quer perder por semana?')).toBeTruthy();

    await userEvent.press(screen.getByRole('radio', { name: /^Perder 0,75 kg por semana/ }));
    await userEvent.press(screen.getByRole('button', { name: 'Calcular minha meta' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ weeklyPaceKg: 0.75 }));
  });

  it('ritmo semanal: em "manter o peso" não pergunta e envia sem ritmo', async () => {
    const onSubmit = jest.fn();
    await render(<SteppedProfileForm isSubmitting={false} onSubmit={onSubmit} />);
    await goToLastStep();

    await userEvent.press(screen.getByRole('radio', { name: 'Manter o peso' }));
    expect(screen.queryByText(/por semana\?/)).toBeNull();
    await userEvent.press(screen.getByRole('button', { name: 'Calcular minha meta' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ goal: 'maintain', weeklyPaceKg: null }));
  });

  it('volta ao passo anterior sem perder o que foi preenchido', async () => {
    await render(<SteppedProfileForm isSubmitting={false} onSubmit={jest.fn()} />);
    await userEvent.type(screen.getByLabelText('Data de nascimento'), '20051996');
    await userEvent.type(screen.getByLabelText('Altura (cm)'), '165');
    await userEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    await userEvent.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.getByLabelText('Data de nascimento')).toHaveDisplayValue('20/05/1996');
  });

  it('segue o idioma escolhido (inglês)', async () => {
    await i18n.changeLanguage('en');
    try {
      await render(<SteppedProfileForm isSubmitting={false} onSubmit={jest.fn()} />);
      expect(screen.getByText('Step 1 of 4')).toBeTruthy();
      expect(screen.getByLabelText('Date of birth')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
    } finally {
      await i18n.changeLanguage('pt-BR');
    }
  });
});
