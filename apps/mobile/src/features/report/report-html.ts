import { localDateFromIso } from '@/features/diary/date-utils';
import { displayNumber } from '@/features/accessibility/spoken-format';
import { buildWeightChart } from '@/features/weight/chart-geometry';
import { formatKg } from '@/features/weight/format-weight';

import type { DayRow, GoalRow, ProgressReport, WeekRow, WeightSection } from './progress-report';

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
  return localDateFromIso(isoDate).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function dateTimeLabel(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function signedKg(value: number): string {
  if (Math.abs(value) < 0.05) return 'sem mudança';
  return `${value > 0 ? '+' : '−'}${formatKg(Math.abs(value))}`;
}

function weightSection(weight: WeightSection | null): string {
  if (!weight) return '<p class="vazio">Nenhum peso registrado ainda.</p>';

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
      <div class="card"><span>Primeiro registro</span><strong>${formatKg(weight.firstKg)}</strong></div>
      <div class="card"><span>Último registro</span><strong>${formatKg(weight.lastKg)}</strong></div>
      <div class="card"><span>Diferença</span><strong>${signedKg(weight.changeKg)}</strong></div>
    </div>
    <svg viewBox="0 0 ${CHART.width} ${CHART.height}" class="grafico" role="img" aria-label="Gráfico do peso ao longo do tempo">
      <polyline points="${chart.polyline}" fill="none" stroke="#3e8e5b" stroke-width="2.5" />
      ${dots}
    </svg>
    <p class="nota">Escala do gráfico: de ${formatKg(chart.min)} (embaixo) a ${formatKg(chart.max)} (em cima).
    Só o peso da balança comum. Medidas de aparelhos de bioimpedância não entram aqui.</p>
    <table><thead><tr><th>Data</th><th class="num">Peso</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function weekRow(week: WeekRow): string {
  const target = week.targetKcal === null ? '—' : kcal(week.targetKcal);
  return `<tr>
    <td>${dateLabel(week.weekStart)} a ${dateLabel(week.weekEnd)}</td>
    <td class="num">${week.daysLogged}</td>
    <td class="num">${kcal(week.average.kcal)}</td>
    <td class="num">${target}</td>
    <td class="num">${grams(week.average.proteinG)}</td>
    <td class="num">${grams(week.average.carbG)}</td>
    <td class="num">${grams(week.average.fatG)}</td>
  </tr>`;
}

function weeksSection(weeks: readonly WeekRow[]): string {
  if (weeks.length === 0) return '<p class="vazio">Nenhum dia registrado no diário ainda.</p>';
  return `
    <p class="nota">Média dos dias com registro. Dias sem nada anotado não contam como zero.</p>
    <table>
      <thead><tr><th>Semana</th><th class="num">Dias</th><th class="num">Média</th><th class="num">Meta</th>
      <th class="num">Proteína</th><th class="num">Carboidrato</th><th class="num">Gordura</th></tr></thead>
      <tbody>${weeks.map(weekRow).join('')}</tbody>
    </table>`;
}

function goalRow(goal: GoalRow): string {
  const origin = goal.isManualOverride ? 'Ajustada por você' : 'Calculada pelo app';
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
  if (goals.length === 0) return '<p class="vazio">Nenhuma meta calculada ainda.</p>';
  return `<table>
    <thead><tr><th>A partir de</th><th class="num">Calorias</th><th class="num">Proteína</th>
    <th class="num">Carboidrato</th><th class="num">Gordura</th><th>Origem</th></tr></thead>
    <tbody>${goals.map(goalRow).join('')}</tbody>
  </table>`;
}

function quantityLabel(item: DayRow['meals'][number]['items'][number]): string {
  const value = displayNumber(Number(item.quantity), 1);
  return item.unit === 'grams' ? `${value} g` : `${value} porção(ões)`;
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
  if (days.length === 0) return '<p class="vazio">Nenhum dia registrado no diário ainda.</p>';
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
<html lang="pt-BR">
<head><meta charset="utf-8" /><title>Relatório de progresso — Gota Vital</title><style>${STYLE}</style></head>
<body>
  <h1>Relatório de progresso</h1>
  <p class="sub">Gota Vital · gerado em ${dateTimeLabel(report.generatedAt)}</p>

  <h2>Peso</h2>
  ${weightSection(report.weight)}

  <h2>Médias por semana</h2>
  ${weeksSection(report.weeks)}

  <h2>Suas metas</h2>
  ${goalsSection(report.goals)}

  <h2>Diário completo</h2>
  ${diarySection(report.days)}

  <footer>
    Este relatório é informativo e não substitui orientação de nutricionista ou médico.
    Os números vêm do que você registrou no app.<br />
    Dados nutricionais: Tabela Brasileira de Composição de Alimentos (TACO/Unicamp) e Open Food Facts (licença ODbL).
  </footer>
</body>
</html>`;
}
