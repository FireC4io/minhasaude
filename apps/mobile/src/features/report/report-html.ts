import i18n from 'i18next';
import { localDateFromIso } from '@/features/diary/date-utils';
import { displayNumber } from '@/features/accessibility/spoken-format';
import { buildWeightChart } from '@/features/weight/chart-geometry';
import { formatKg } from '@/features/weight/format-weight';

import type { DayRow, GoalRow, ProgressReport, WeekRow, WeightSection } from './progress-report';
import { appLocale } from '@/i18n/format';

/**
 * HTML do relatório de progresso, impresso em PDF pelo `expo-print`.
 *
 * Paleta clara fixa (é papel, não tela) e fonte do sistema: as fontes da
 * identidade não estão disponíveis no motor de impressão. Todo texto vindo de
 * dado passa por `escapeHtml` — nome de alimento é digitado pela pessoa.
 */

const CHART = { width: 640, height: 200, padding: 16 };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const kcal = (value: number): string => `${displayNumber(value, 0)} kcal`;
const grams = (value: number): string => `${displayNumber(value, 0)} g`;

function dateLabel(isoDate: string): string {
  return localDateFromIso(isoDate).toLocaleDateString(appLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function dateTimeLabel(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleDateString(appLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function signedKg(value: number): string {
  if (Math.abs(value) < 0.05) return i18n.t('pdf.noChange');
  return `${value > 0 ? '+' : '−'}${formatKg(Math.abs(value))}`;
}

function weightSection(weight: WeightSection | null): string {
  if (!weight) return `<p class="vazio">${i18n.t('pdf.noWeight')}</p>`;

  const chart = buildWeightChart(
    weight.entries.map((e) => ({ measuredAt: e.measuredAt, weightKg: String(e.weightKg) })),
    CHART,
  );
  const dots = chart.points
    .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#3e8e5b" />`)
    .join('');
  const rows = [...weight.entries]
    .reverse()
    .map((e) => `<tr><td>${dateTimeLabel(e.measuredAt)}</td><td class="num">${formatKg(e.weightKg)}</td></tr>`)
    .join('');

  return `
    <div class="cards">
      <div class="card"><span>${i18n.t('pdf.first')}</span><strong>${formatKg(weight.firstKg)}</strong></div>
      <div class="card"><span>${i18n.t('pdf.last')}</span><strong>${formatKg(weight.lastKg)}</strong></div>
      <div class="card"><span>${i18n.t('pdf.difference')}</span><strong>${signedKg(weight.changeKg)}</strong></div>
    </div>
    <svg viewBox="0 0 ${CHART.width} ${CHART.height}" class="grafico" role="img" aria-label="${i18n.t('pdf.chartAria')}">
      <polyline points="${chart.polyline}" fill="none" stroke="#3e8e5b" stroke-width="2.5" />
      ${dots}
    </svg>
    <p class="nota">${i18n.t('pdf.scale', { min: formatKg(chart.min), max: formatKg(chart.max) })}
    ${i18n.t('pdf.scaleOnly')}</p>
    <table><thead><tr><th>${i18n.t('pdf.date')}</th><th class="num">${i18n.t('pdf.weight')}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function weekRow(week: WeekRow): string {
  const target = week.targetKcal === null ? '—' : kcal(week.targetKcal);
  return `<tr>
    <td>${i18n.t('pdf.weekRange', { from: dateLabel(week.weekStart), to: dateLabel(week.weekEnd) })}</td>
    <td class="num">${week.daysLogged}</td>
    <td class="num">${kcal(week.average.kcal)}</td>
    <td class="num">${target}</td>
    <td class="num">${grams(week.average.proteinG)}</td>
    <td class="num">${grams(week.average.carbG)}</td>
    <td class="num">${grams(week.average.fatG)}</td>
  </tr>`;
}

function weeksSection(weeks: readonly WeekRow[]): string {
  if (weeks.length === 0) return `<p class="vazio">${i18n.t('pdf.noDays')}</p>`;
  return `
    <p class="nota">${i18n.t('pdf.weekNote')}</p>
    <table>
      <thead><tr><th>${i18n.t('pdf.week')}</th><th class="num">${i18n.t('pdf.days')}</th><th class="num">${i18n.t('pdf.average')}</th><th class="num">${i18n.t('pdf.goal')}</th>
      <th class="num">${i18n.t('pdf.protein')}</th><th class="num">${i18n.t('pdf.carbs')}</th><th class="num">${i18n.t('pdf.fat')}</th></tr></thead>
      <tbody>${weeks.map(weekRow).join('')}</tbody>
    </table>`;
}

function goalRow(goal: GoalRow): string {
  const origin = goal.isManualOverride ? i18n.t('pdf.manual') : i18n.t('pdf.calculated');
  return `<tr>
    <td>${dateTimeLabel(goal.activeFrom)}</td>
    <td class="num">${kcal(goal.kcal)}</td>
    <td class="num">${grams(goal.proteinG)}</td>
    <td class="num">${grams(goal.carbG)}</td>
    <td class="num">${grams(goal.fatG)}</td>
    <td>${origin}</td>
  </tr>`;
}

function goalsSection(goals: readonly GoalRow[]): string {
  if (goals.length === 0) return `<p class="vazio">${i18n.t('pdf.noGoals')}</p>`;
  return `<table>
    <thead><tr><th>${i18n.t('pdf.since')}</th><th class="num">${i18n.t('pdf.calories')}</th><th class="num">${i18n.t('pdf.protein')}</th>
    <th class="num">${i18n.t('pdf.carbs')}</th><th class="num">${i18n.t('pdf.fat')}</th><th>${i18n.t('pdf.origin')}</th></tr></thead>
    <tbody>${goals.map(goalRow).join('')}</tbody>
  </table>`;
}

function quantityLabel(item: DayRow['meals'][number]['items'][number]): string {
  const value = displayNumber(Number(item.quantity), 1);
  return item.unit === 'grams' ? `${value} g` : i18n.t('pdf.portion', { count: Number(item.quantity), value });
}

function daySection(day: DayRow): string {
  const meals = day.meals
    .map((meal) => {
      const items = meal.items
        .map(
          (item) =>
            `<tr><td>${escapeHtml(item.name)}</td><td class="num">${quantityLabel(item)}</td><td class="num">${kcal(item.kcal)}</td></tr>`,
        )
        .join('');
      return `<tr class="refeicao"><td colspan="3">${escapeHtml(meal.label)}</td></tr>${items}`;
    })
    .join('');
  return `<div class="dia">
    <h3>${dateLabel(day.date)} · ${kcal(day.totals.kcal)}</h3>
    <table><tbody>${meals}</tbody></table>
  </div>`;
}

function diarySection(days: readonly DayRow[]): string {
  if (days.length === 0) return `<p class="vazio">${i18n.t('pdf.noDays')}</p>`;
  return days.map(daySection).join('');
}

const STYLE = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, 'Segoe UI', sans-serif; color: #2b3a34; margin: 32px; font-size: 12px; line-height: 1.5; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  h2 { font-size: 17px; margin: 28px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #e3d5c6; }
  h3 { font-size: 13px; margin: 16px 0 4px; }
  .sub, .nota, .vazio { color: #5f6e67; }
  .cards { display: flex; gap: 12px; margin: 8px 0 12px; }
  .card { flex: 1; border: 1px solid #e3d5c6; border-radius: 10px; padding: 10px; }
  .card span { display: block; color: #5f6e67; font-size: 11px; }
  .card strong { font-size: 16px; }
  .grafico { width: 100%; height: auto; border: 1px solid #e3d5c6; border-radius: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #eee3d8; }
  th { color: #5f6e67; font-weight: 600; font-size: 11px; }
  .num { text-align: right; white-space: nowrap; }
  .refeicao td { font-weight: 600; padding-top: 8px; }
  .dia { page-break-inside: avoid; }
  footer { margin-top: 32px; color: #5f6e67; font-size: 10px; border-top: 1px solid #e3d5c6; padding-top: 8px; }
`;

export function renderReportHtml(report: ProgressReport): string {
  return `<!doctype html>
<html lang="${appLocale()}">
<head><meta charset="utf-8" /><title>${i18n.t('pdf.docTitle')}</title><style>${STYLE}</style></head>
<body>
  <h1>${i18n.t('pdf.title')}</h1>
  <p class="sub">${i18n.t('pdf.generated', { date: dateTimeLabel(report.generatedAt) })}</p>

  <h2>${i18n.t('pdf.weight')}</h2>
  ${weightSection(report.weight)}

  <h2>${i18n.t('pdf.weeks')}</h2>
  ${weeksSection(report.weeks)}

  <h2>${i18n.t('pdf.goals')}</h2>
  ${goalsSection(report.goals)}

  <h2>${i18n.t('pdf.diary')}</h2>
  ${diarySection(report.days)}

  <footer>
    ${i18n.t('pdf.footer')}<br />
    ${i18n.t('pdf.credits')}
  </footer>
</body>
</html>`;
}
