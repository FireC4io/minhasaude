import { changeLanguage } from 'i18next';

import { reminderMessage } from './reminder-messages';

const lunch = { kind: 'meal' as const, meal: 'lunch' as const, date: '2026-10-12' };

describe('reminderMessage', () => {
  beforeEach(async () => {
    await changeLanguage('pt-BR');
  });

  it('refeição: título é a refeição, o texto cita a refeição em minúscula', () => {
    const message = reminderMessage(lunch, 'direct', false);
    expect(message.title).toBe('Almoço');
    expect(message.body).toMatch(/almoço/);
    expect(message.body).not.toMatch(/\{\{/);
  });

  it('mesmo dia, mesma frase; outro dia pode trocar', () => {
    expect(reminderMessage(lunch, 'gentle', false)).toEqual(reminderMessage(lunch, 'gentle', false));
    const bodies = new Set(
      Array.from({ length: 10 }, (_, i) => reminderMessage({ ...lunch, date: `2026-10-${10 + i}` }, 'gentle', false).body),
    );
    expect(bodies.size).toBeGreaterThan(1);
  });

  it('discreta: não diz do que é', () => {
    expect(reminderMessage(lunch, 'playful', true)).toEqual({ title: 'Gota Vital', body: 'Você tem um lembrete.' });
  });

  it('peso e fim do dia têm título próprio', () => {
    expect(reminderMessage({ kind: 'weight', date: '2026-10-12' }, 'gentle', false).title).toBe('Peso da semana');
    expect(reminderMessage({ kind: 'evening', date: '2026-10-12' }, 'direct', false).title).toBe('Como foi o seu dia?');
  });

  it('todos os tons e tipos têm texto nos três idiomas', async () => {
    for (const language of ['pt-BR', 'en', 'es']) {
      await changeLanguage(language);
      for (const tone of ['gentle', 'direct', 'playful'] as const) {
        for (let day = 10; day < 20; day++) {
          const date = `2026-10-${day}`;
          for (const r of [{ ...lunch, date }, { kind: 'weight' as const, date }, { kind: 'evening' as const, date }]) {
            const { title, body } = reminderMessage(r, tone, false);
            expect(title).not.toMatch(/reminders\./);
            expect(body).not.toMatch(/reminders\.|\{\{/);
          }
        }
      }
    }
  });
});
