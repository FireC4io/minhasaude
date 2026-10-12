import { render, screen, userEvent } from '@testing-library/react-native';

import RemindersScreen from '@/app/account/reminders';
import { requestReminderPermission } from '@/features/reminders/reminder-scheduler';
import { resetReminderStore } from '@/features/reminders/reminder-store';

jest.mock('@/features/reminders/reminder-scheduler', () => ({
  REMINDERS_SUPPORTED: true,
  requestReminderPermission: jest.fn(async () => 'granted'),
  sendTestReminder: jest.fn(async () => undefined),
  cancelAllReminders: jest.fn(async () => undefined),
}));

const request = requestReminderPermission as jest.Mock;

describe('tela de lembretes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await resetReminderStore();
  });

  it('começa desligada; ligar pede permissão e mostra as opções', async () => {
    await render(<RemindersScreen />);
    expect(screen.queryByText('Refeições')).toBeNull();

    await userEvent.press(screen.getByRole('checkbox', { name: 'Receber lembretes' }));

    expect(request).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Refeições')).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Só lembrar se eu ainda não anotei' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Almoço: 15 minutos mais tarde' })).toBeOnTheScreen();
  });

  it('permissão negada: explica e oferece abrir as configurações', async () => {
    request.mockResolvedValueOnce('blocked');
    await render(<RemindersScreen />);
    await userEvent.press(screen.getByRole('checkbox', { name: 'Receber lembretes' }));

    expect(await screen.findByText(/não deixou o Gota Vital mandar avisos/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Abrir configurações do celular' })).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Receber lembretes' })).not.toBeChecked();
  });

  it('o horário muda de 15 em 15 minutos', async () => {
    await render(<RemindersScreen />);
    await userEvent.press(screen.getByRole('checkbox', { name: 'Receber lembretes' }));
    await userEvent.press(await screen.findByRole('button', { name: 'Almoço: 15 minutos mais tarde' }));
    expect(screen.getByLabelText('Almoço, às 12:45')).toBeOnTheScreen();
  });
});
