import type { MacroTotalsDto } from '@/api/generated/models';
import { spokenGrams, spokenKcal } from '@/features/accessibility/spoken-format';

interface DiaryEntryLike {
  foodName: string;
  /** Vem como string porque a coluna é `numeric` no Postgres. */
  quantity: string;
  kcal: string;
}

export function describeDiaryEntry({ foodName, quantity, kcal }: DiaryEntryLike): string {
  return `${foodName}, ${spokenGrams(Number(quantity))}, ${spokenKcal(Number(kcal))}`;
}

export function describeMealHeader(mealLabel: string, entryCount: number, kcalTotal: number): string {
  if (entryCount === 0) {
    return `${mealLabel}, nenhum alimento registrado`;
  }
  const items = entryCount === 1 ? '1 alimento' : `${entryCount} alimentos`;
  return `${mealLabel}, ${items}, ${spokenKcal(kcalTotal)}`;
}

const MACROS = [
  { key: 'proteinG', label: 'Proteína' },
  { key: 'fatG', label: 'Gordura' },
  { key: 'carbG', label: 'Carboidrato' },
] as const;

function describeKcal(consumed: number, target: number | null, remaining: number | null): string {
  if (target === null) {
    return `Consumido: ${spokenKcal(consumed)}. Meta ainda não calculada.`;
  }
  const consumedOfTarget = `${Math.round(consumed).toLocaleString('pt-BR')} de ${spokenKcal(target)}`;
  // Ler "menos 150 quilocalorias restantes" confunde; dizer o excedente é mais
  // claro. Continua informativo: não sugere o que fazer com isso.
  const rest =
    remaining === null
      ? ''
      : remaining < 0
        ? `, ${Math.round(-remaining).toLocaleString('pt-BR')} acima da meta`
        : `, faltam ${Math.round(remaining).toLocaleString('pt-BR')}`;
  return `Consumido: ${consumedOfTarget}${rest}.`;
}

/** O card de resumo lido como uma parada só, em vez de oito textos soltos. */
export function describeMacroSummary(
  consumed: MacroTotalsDto,
  target: MacroTotalsDto | null,
  remaining: MacroTotalsDto | null,
): string {
  const macros = MACROS.map(({ key, label }) => {
    const value = Math.round(consumed[key]).toLocaleString('pt-BR');
    return target
      ? `${label}: ${value} de ${spokenGrams(Math.round(target[key]))}.`
      : `${label}: ${spokenGrams(Math.round(consumed[key]))}.`;
  });

  return [describeKcal(consumed.kcal, target?.kcal ?? null, remaining?.kcal ?? null), ...macros].join(' ');
}

/** Busca só dispara a partir de 2 letras; antes disso, e durante, não há o que dizer. */
export function describeSearchStatus(term: string, isFetching: boolean, count: number): string | null {
  if (term.trim().length < 2 || isFetching) return null;
  if (count === 0) return 'Nenhum alimento encontrado.';
  return count === 1 ? '1 alimento encontrado.' : `${count} alimentos encontrados.`;
}
