import { FoodSource } from '../../database/entities/food.entity';
import type { SearchTerms } from './search-terms';

// Janela do "o que a pessoa costuma comer": hábito recente, não de anos atrás.
const HABIT_WINDOW_DAYS = 180;

export interface FoodSearchQuery {
  sql: string;
  params: unknown[];
}

/**
 * Busca de alimento ordenada por relevância. O filtro continua sendo trigrama
 * + unaccent (ADR-0004); o que mudou é a ordem, em camadas:
 *
 * 1. o que a pessoa registrou nos últimos 180 dias (mais vezes primeiro);
 * 2. a forma padrão do termo (`PREFERRED_FOODS`), na ordem da lista;
 * 3. nome-base igual ao termo: "Arroz, tipo 1, cozido" para "arroz";
 * 4. nome-base começando pela primeira palavra e contendo as outras:
 *    "Pão, trigo, francês" para "pão francês";
 * 5. nome começando pelo termo: "Arroz carreteiro";
 * 6. termo citado no meio: "Baião de dois, arroz e feijão-de-corda";
 * 7. o resto, por similaridade.
 *
 * Desempate: similaridade, cozido antes de cru, nome curto antes de longo.
 * Os tokens só têm `[a-z0-9]` (ver `normalizeSearchText`), então montar a
 * regex com eles é seguro; ainda assim tudo vai como parâmetro.
 */
export function buildFoodSearchQuery(
  userId: string,
  terms: SearchTerms,
  page: number,
  limit: number,
): FoodSearchQuery {
  const sql = `
    with candidates as (
      select f.id,
             f.name,
             immutable_unaccent(lower(f.name)) as n,
             trim(split_part(immutable_unaccent(lower(f.name)), ',', 1)) as head
        from foods f
       where (f.source != $2 or f.owner_user_id = $1)
         and $3 <% immutable_unaccent(lower(f.name))
    ),
    scored as (
      select c.*,
             not exists (
               select 1 from unnest($4::text[]) t
                where c.n !~ ('(^|[^a-z0-9])' || t)
             ) as has_all_tokens
        from candidates c
    ),
    habits as (
      select food_id, count(*)::int as uses
        from diary_entries
       where user_id = $1
         and entry_date >= current_date - ${HABIT_WINDOW_DAYS}
       group by food_id
    )
    select s.id, count(*) over ()::int as total
      from scored s
      left join habits h on h.food_id = s.id
     order by
       coalesce(h.uses, 0) desc,
       coalesce(array_position($5::text[], s.name), 2147483647),
       case
         when s.head = $3 then 0
         when split_part(s.head, ' ', 1) = $4[1] and s.has_all_tokens then 1
         when s.n like $3 || '%' then 2
         when s.has_all_tokens then 3
         else 4
       end,
       word_similarity($3, s.n) desc,
       case when s.n ~ ',\\s*crua?(,|$)' then 1 else 0 end,
       length(s.name),
       s.name
     limit $6 offset $7`;

  return {
    sql,
    params: [
      userId,
      FoodSource.CUSTOM,
      terms.query,
      terms.tokens,
      terms.preferred,
      limit,
      (page - 1) * limit,
    ],
  };
}
