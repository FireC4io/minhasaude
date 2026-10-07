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

/** Busca só dispara a partir de 2 letras; antes disso, e durante, não há o que dizer. */
export function describeSearchStatus(term: string, isFetching: boolean, count: number): string | null {
  if (term.trim().length < 2 || isFetching) return null;
  if (count === 0) return 'Nenhum alimento encontrado.';
  return count === 1 ? '1 alimento encontrado.' : `${count} alimentos encontrados.`;
}
