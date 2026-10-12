import { MAX_SCHEDULED, isoWeekday, planReminders } from './reminder-plan';
import {
  DEFAULT_REMINDER_SETTINGS,
  parseReminderSettings,
  shiftTime,
  type ReminderSettings,
} from './reminder-settings';

// Segunda-feira, 12/10/2026, 10h da manhã (horário local).
const now = new Date(2026, 9, 12, 10, 0);
const on: ReminderSettings = { ...DEFAULT_REMINDER_SETTINGS, enabled: true };
const none = new Set<never>();
const at = (r: { at: Date }) => `${r.at.getDate()}/${r.at.getHours()}:${String(r.at.getMinutes()).padStart(2, '0')}`;

describe('planReminders', () => {
  it('desligado: nada agendado', () => {
    expect(planReminders(DEFAULT_REMINDER_SETTINGS, now, none)).toEqual([]);
  });

  it('hoje só o que ainda vai acontecer; amanhã o dia inteiro', () => {
    const plan = planReminders(on, now, none, 2);
    // Café (8h) de hoje já passou; ficam almoço e jantar de hoje e as três de amanhã.
    expect(plan.map(at)).toEqual(['12/12:30', '12/19:30', '13/8:00', '13/12:30', '13/19:30']);
    expect(plan[0]).toMatchObject({ id: 'gv-meal-lunch-2026-10-12', kind: 'meal', meal: 'lunch', date: '2026-10-12' });
  });

  it('"só se eu ainda não anotei": pula o almoço de hoje, não o de amanhã', () => {
    const plan = planReminders(on, now, new Set(['lunch'] as const), 2);
    expect(plan.map((r) => r.id)).toEqual([
      'gv-meal-dinner-2026-10-12',
      'gv-meal-breakfast-2026-10-13',
      'gv-meal-lunch-2026-10-13',
      'gv-meal-dinner-2026-10-13',
    ]);
  });

  it('sem a opção, lembra mesmo do que já foi anotado', () => {
    const plan = planReminders({ ...on, skipIfLogged: false }, now, new Set(['lunch'] as const), 1);
    expect(plan.map((r) => r.meal)).toEqual(['lunch', 'dinner']);
  });

  it('dias da semana: só os escolhidos (aqui, fim de semana)', () => {
    const plan = planReminders({ ...on, weekdays: [6, 7] }, now, none, 7);
    expect(new Set(plan.map((r) => r.date))).toEqual(new Set(['2026-10-17', '2026-10-18']));
  });

  it('peso: uma vez por semana, no dia escolhido, mesmo fora dos dias das refeições', () => {
    const settings = { ...on, weekdays: [], weight: { enabled: true, weekday: 3, time: '07:00' } };
    const plan = planReminders(settings, now, none, 10);
    expect(plan.map((r) => `${r.kind} ${r.date}`)).toEqual(['weight 2026-10-14', 'weight 2026-10-21']);
  });

  it('pausa: nada até o dia escolhido, inclusive', () => {
    const plan = planReminders({ ...on, pausedUntil: '2026-10-14' }, now, none, 4);
    expect(new Set(plan.map((r) => r.date))).toEqual(new Set(['2026-10-15']));
  });

  it('noite: entra depois das refeições', () => {
    const plan = planReminders({ ...on, evening: { enabled: true, time: '21:00' } }, now, none, 1);
    expect(plan.map((r) => r.kind)).toEqual(['meal', 'meal', 'evening']);
  });

  it('nunca passa do limite de notificações agendadas do iPhone', () => {
    const all = {
      ...on,
      meals: {
        breakfast: { enabled: true, time: '08:00' },
        lunch: { enabled: true, time: '12:00' },
        snack: { enabled: true, time: '16:00' },
        dinner: { enabled: true, time: '20:00' },
      },
      evening: { enabled: true, time: '22:00' },
    };
    const plan = planReminders(all, now, none, 30);
    expect(plan).toHaveLength(MAX_SCHEDULED);
    // Corta do fim: os mais próximos ficam.
    expect(plan[0]?.date).toBe('2026-10-12');
  });

  it('ids únicos (reagendar não duplica)', () => {
    const ids = planReminders({ ...on, evening: { enabled: true, time: '21:00' } }, now, none).map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('apoio', () => {
  it('dia da semana ISO', () => {
    expect(isoWeekday('2026-10-12')).toBe(1);
    expect(isoWeekday('2026-10-18')).toBe(7);
  });

  it('passo de horário dá a volta no dia', () => {
    expect(shiftTime('12:30', 15)).toBe('12:45');
    expect(shiftTime('23:50', 15)).toBe('00:05');
    expect(shiftTime('00:00', -15)).toBe('23:45');
  });

  it('configuração salva fora do formato volta para o padrão', () => {
    expect(parseReminderSettings({ enabled: 'sim' })).toEqual(DEFAULT_REMINDER_SETTINGS);
    expect(parseReminderSettings({ ...on, tone: 'divertido' })).toEqual(DEFAULT_REMINDER_SETTINGS);
    expect(parseReminderSettings(on)).toEqual(on);
  });
});
