import i18n from 'i18next';
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
    return i18n.t('diary.mealEmptySpoken', { meal: mealLabel });
  }
  const items = i18n.t('diary.mealCount', { count: entryCount });
  return `${mealLabel}, ${items}, ${spokenKcal(kcalTotal)}`;
}

/** Busca só dispara a partir de 2 letras; antes disso, e durante, não há o que dizer. */
export function describeSearchStatus(term: string, isFetching: boolean, count: number): string | null {
  if (term.trim().length < 2 || isFetching) return null;
  // `_zero` explícito: "Nenhum alimento", não "0 alimentos encontrados".
  return count === 0 ? i18n.t('diary.found_zero') : i18n.t('diary.found', { count });
}
