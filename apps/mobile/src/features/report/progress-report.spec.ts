import type { ProgressReportResponseDto } from '@/api/generated/models';

import { buildProgressReport } from './progress-report';

function food(name: string) {
  return {
    id: `f-${name}`,
    name,
    brand: null,
    source: 'taco',
    kcalPer100g: '100',
    proteinGPer100g: '1',
    fatGPer100g: '1',
    carbGPer100g: '1',
  };
}

function entry(date: string, mealType: string, name: string, kcal: number, quantity = '100') {
  return {
    id: `${date}-${name}`,
    foodId: `f-${name}`,
    food: food(name),
    entryDate: date,
    mealType,
    quantity,
    unit: 'grams',
    portionId: null,
    kcalSnapshot: String(kcal),
    proteinGSnapshot: '10',
    fatGSnapshot: '5',
    carbGSnapshot: '20',
  };
}

function goal(activeFrom: string, targetKcal: number) {
  return {
    id: `g-${activeFrom}`,
    calculationMethod: 'mifflin_st_jeor',
    bmrKcal: '1500',
    tdeeKcal: '2000',
    targetKcal: String(targetKcal),
    proteinG: '100',
    fatG: '60',
    carbG: '200',
    isManualOverride: false,
    activeFrom,
  };
}

function report(overrides: Partial<ProgressReportResponseDto> = {}): ProgressReportResponseDto {
  return {
    generatedAt: '2026-10-07T12:00:00.000Z',
    weights: [],
    goals: [],
    diaryEntries: [],
    ...overrides,
  } as ProgressReportResponseDto;
}

describe('buildProgressReport', () => {
  it('resume o peso do primeiro ao último registro', () => {
    const model = buildProgressReport(
      report({
        weights: [
          { id: '1', measuredAt: '2026-09-01T10:00:00.000Z', source: 'manual', weightKg: '70.40' },
          { id: '2', measuredAt: '2026-10-01T10:00:00.000Z', source: 'manual', weightKg: '68.90' },
        ] as ProgressReportResponseDto['weights'],
      }),
    );

    expect(model.weight).not.toBeNull();
    expect(model.weight?.firstKg).toBe(70.4);
    expect(model.weight?.lastKg).toBe(68.9);
    expect(model.weight?.changeKg).toBeCloseTo(-1.5);
    expect(model.weight?.entries).toHaveLength(2);
  });

  it('sem peso registrado, a seção de peso fica vazia', () => {
    expect(buildProgressReport(report()).weight).toBeNull();
  });

  it('agrupa o diário por dia e por refeição, na ordem das refeições', () => {
    const model = buildProgressReport(
      report({
        diaryEntries: [
          entry('2026-10-05', 'dinner', 'Sopa', 200),
          entry('2026-10-05', 'breakfast', 'Pão', 150),
          entry('2026-10-05', 'breakfast', 'Café', 10),
          entry('2026-10-06', 'lunch', 'Arroz', 130),
        ] as ProgressReportResponseDto['diaryEntries'],
      }),
    );

    expect(model.days.map((d) => d.date)).toEqual(['2026-10-05', '2026-10-06']);
    const [first] = model.days;
    expect(first?.meals.map((m) => m.label)).toEqual(['Café da manhã', 'Jantar']);
    expect(first?.meals[0]?.items.map((i) => i.name)).toEqual(['Pão', 'Café']);
    expect(first?.totals.kcal).toBe(360);
  });

  it('média semanal conta só os dias com registro', () => {
    const model = buildProgressReport(
      report({
        // 2026-10-04 é domingo: os dois dias caem na mesma semana.
        diaryEntries: [
          entry('2026-10-05', 'lunch', 'Arroz', 1800),
          entry('2026-10-07', 'lunch', 'Arroz', 2200),
        ] as ProgressReportResponseDto['diaryEntries'],
      }),
    );

    expect(model.weeks).toHaveLength(1);
    expect(model.weeks[0]?.weekStart).toBe('2026-10-04');
    expect(model.weeks[0]?.daysLogged).toBe(2);
    expect(model.weeks[0]?.average.kcal).toBe(2000);
  });

  it('compara cada semana com a meta que valia naquela semana', () => {
    const model = buildProgressReport(
      report({
        goals: [goal('2026-09-01T10:00:00.000Z', 1800), goal('2026-10-06T10:00:00.000Z', 1600)] as ProgressReportResponseDto['goals'],
        diaryEntries: [
          entry('2026-09-29', 'lunch', 'Arroz', 1900),
          entry('2026-10-12', 'lunch', 'Arroz', 1500),
        ] as ProgressReportResponseDto['diaryEntries'],
      }),
    );

    expect(model.weeks.map((w) => w.targetKcal)).toEqual([1800, 1600]);
  });

  it('semana anterior a qualquer meta fica sem meta', () => {
    const model = buildProgressReport(
      report({
        goals: [goal('2026-10-01T10:00:00.000Z', 1800)] as ProgressReportResponseDto['goals'],
        diaryEntries: [entry('2026-09-01', 'lunch', 'Arroz', 1900)] as ProgressReportResponseDto['diaryEntries'],
      }),
    );

    expect(model.weeks[0]?.targetKcal).toBeNull();
  });

  it('lista as metas com data e valores', () => {
    const model = buildProgressReport(
      report({ goals: [goal('2026-09-01T10:00:00.000Z', 1800)] as ProgressReportResponseDto['goals'] }),
    );

    expect(model.goals).toEqual([
      { activeFrom: '2026-09-01T10:00:00.000Z', kcal: 1800, proteinG: 100, fatG: 60, carbG: 200, isManualOverride: false },
    ]);
  });
});
