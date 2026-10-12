import { usePortionsControllerList } from '@/api/generated/endpoints/foods/foods';
import { appLanguage } from '@/i18n/format';

import { GRAMS, OUNCES, offersOunces, type Measure } from './measures';

/**
 * Medidas que a pessoa pode escolher para o alimento: gramas sempre, onça em
 * inglês e as medidas caseiras (do IBGE e as criadas por ela). Sem internet,
 * fica só gramas — anotar continua possível.
 */
export function useFoodMeasures(foodId: string | undefined): { measures: Measure[]; isLoading: boolean } {
  const query = usePortionsControllerList(foodId ?? '', { query: { enabled: Boolean(foodId) } });
  const portions = query.data ?? [];
  const measures: Measure[] = [
    GRAMS,
    ...(offersOunces(appLanguage()) ? [OUNCES] : []),
    ...portions.map((portion): Measure => ({ type: 'portion', portion })),
  ];
  return { measures, isLoading: Boolean(foodId) && query.isPending };
}
