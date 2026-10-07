import type {
  DiaryEntryResponseDto,
  GoalTargetResponseDto,
  ProgressReportResponseDto,
} from '@/api/generated/models';
import { isoDateFromLocal, weekOf } from '@/features/diary/date-utils';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from '@/features/diary/meal-type-labels';

/**
 * Modelo do relatório de progresso em PDF, montado a partir da resposta de
 * `GET /v1/me/progress-report`. Lógica pura: o HTML só desenha o que sai daqui.
 *
 * Texto informativo, nunca diagnóstico (RDC 657/2022): o modelo traz números e
 * comparações com a meta, sem julgamento.
 */

export interface Macros {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
}

export interface WeightSection {
  firstKg: number;
  lastKg: number;
  changeKg: number;
  entries: { measuredAt: string; weightKg: number }[];
}

export interface WeekRow {
  weekStart: string;
  weekEnd: string;
  daysLogged: number;
  average: Macros;
  targetKcal: number | null;
}

export interface GoalRow extends Macros {
  activeFrom: string;
  isManualOverride: boolean;
}

export interface DayItem {
  name: string;
  quantity: string;
  unit: DiaryEntryResponseDto['unit'];
  kcal: number;
}

export interface DayRow {
  date: string;
  meals: { label: string; items: DayItem[] }[];
  totals: Macros;
}

export interface ProgressReport {
  generatedAt: string;
  weight: WeightSection | null;
  weeks: WeekRow[];
  goals: GoalRow[];
  days: DayRow[];
}

const ZERO: Macros = { kcal: 0, proteinG: 0, fatG: 0, carbG: 0 };

function entryMacros(entry: DiaryEntryResponseDto): Macros {
  return {
    kcal: Number(entry.kcalSnapshot),
    proteinG: Number(entry.proteinGSnapshot),
    fatG: Number(entry.fatGSnapshot),
    carbG: Number(entry.carbGSnapshot),
  };
}

function sum(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    proteinG: a.proteinG + b.proteinG,
    fatG: a.fatG + b.fatG,
    carbG: a.carbG + b.carbG,
  };
}

function divide(m: Macros, n: number): Macros {
  return { kcal: m.kcal / n, proteinG: m.proteinG / n, fatG: m.fatG / n, carbG: m.carbG / n };
}

function buildWeight(weights: ProgressReportResponseDto['weights']): WeightSection | null {
  const entries = weights.map((w) => ({ measuredAt: w.measuredAt, weightKg: Number(w.weightKg) }));
  const first = entries[0];
  const last = entries[entries.length - 1];
  if (!first || !last) return null;
  return { firstKg: first.weightKg, lastKg: last.weightKg, changeKg: last.weightKg - first.weightKg, entries };
}

function groupByDate(entries: readonly DiaryEntryResponseDto[]): Map<string, DiaryEntryResponseDto[]> {
  const byDate = new Map<string, DiaryEntryResponseDto[]>();
  for (const entry of entries) {
    byDate.set(entry.entryDate, [...(byDate.get(entry.entryDate) ?? []), entry]);
  }
  return new Map([...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function buildDay(date: string, entries: readonly DiaryEntryResponseDto[]): DayRow {
  const meals = MEAL_TYPE_ORDER.map((mealType) => ({
    label: MEAL_TYPE_LABELS[mealType],
    items: entries
      .filter((e) => e.mealType === mealType)
      .map((e) => ({ name: e.food.name, quantity: e.quantity, unit: e.unit, kcal: Number(e.kcalSnapshot) })),
  })).filter((meal) => meal.items.length > 0);

  return { date, meals, totals: entries.map(entryMacros).reduce(sum, ZERO) };
}

/** Meta que valia no fim da semana: a mais recente com início até aquele dia. */
function targetForWeek(goals: readonly GoalTargetResponseDto[], weekEnd: string): number | null {
  const applicable = goals.filter((g) => isoDateFromLocal(new Date(g.activeFrom)) <= weekEnd);
  const latest = applicable[applicable.length - 1];
  return latest ? Number(latest.targetKcal) : null;
}

function buildWeeks(days: readonly DayRow[], goals: readonly GoalTargetResponseDto[]): WeekRow[] {
  const byWeek = new Map<string, DayRow[]>();
  for (const day of days) {
    const [weekStart] = weekOf(day.date);
    if (weekStart) byWeek.set(weekStart, [...(byWeek.get(weekStart) ?? []), day]);
  }

  return [...byWeek.entries()].map(([weekStart, weekDays]) => {
    const weekEnd = weekOf(weekStart)[6] ?? weekStart;
    // Média sobre os dias com registro: dia esquecido não conta como zero.
    const total = weekDays.map((d) => d.totals).reduce(sum, ZERO);
    return {
      weekStart,
      weekEnd,
      daysLogged: weekDays.length,
      average: divide(total, weekDays.length),
      targetKcal: targetForWeek(goals, weekEnd),
    };
  });
}

/** Espera pesos, metas e diário em ordem cronológica, como a API devolve. */
export function buildProgressReport(data: ProgressReportResponseDto): ProgressReport {
  const days = [...groupByDate(data.diaryEntries).entries()].map(([date, entries]) =>
    buildDay(date, entries),
  );

  return {
    generatedAt: data.generatedAt,
    weight: buildWeight(data.weights),
    weeks: buildWeeks(days, data.goals),
    goals: data.goals.map((g) => ({
      activeFrom: g.activeFrom,
      kcal: Number(g.targetKcal),
      proteinG: Number(g.proteinG),
      fatG: Number(g.fatG),
      carbG: Number(g.carbG),
      isManualOverride: g.isManualOverride,
    })),
    days,
  };
}
