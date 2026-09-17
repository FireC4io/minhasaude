# Backlog — Fase 2: Núcleo nutricional (formato de issues do GitHub)

> Copiar cada bloco como uma issue no GitHub (`gh issue create`), como foi feito na Fase 1. Ver `docs/roadmap.md` para o entregável da fase e `docs/database-schema.md` para os campos completos de cada tabela.

**Ordem de dependência entre issues**: 10 → 11 → 12; 13 → 14 → 15 (13/14 podem rodar em paralelo com 10-12, mas 15 depende de 12 e de 14).

---

### 10. Catálogo de calculadoras de gasto energético (`packages/shared/src/calculators/`)
**Contexto**: motor puro (sem I/O) por trás do módulo de metas — precisa ser testado à parte, com valores de referência da literatura, antes de virar endpoint. Ver seção "Catálogo de calculadoras" em `docs/database-schema.md` e a convenção de `calculator_version` em `CLAUDE.md`.

- [x] Interface `CalculatorDefinition` (`code`, `version`, `compute`, `unit`, `reference`) em `packages/shared`
- [x] Implementar Mifflin-St Jeor (TMB) — default
- [x] Implementar Katch-McArdle (TMB, requer % de gordura corporal)
- [x] Implementar cálculo de TDEE a partir de TMB × fator de atividade (`activity_level` do perfil)
- [x] Distribuição de macros a partir do TDEE e do objetivo (`goal`: lose | maintain | gain) — proteína g/kg por objetivo (ISSN Position Stand 2017, faixa 1.4-2.0g/kg/d), gordura 27.5% do TDEE (dentro da AMDR 20-35%), carboidrato no restante, com piso de 15% do TDEE reservado a carboidrato para nunca ficar negativo em pesos altos + déficits agressivos
- [x] Testes unitários com casos de referência dos papers originais (Mifflin-St Jeor 1990, Katch-McArdle) — não só "roda sem erro", conferido o número contra a literatura
- [x] Nenhuma dependência de NestJS/TypeORM neste pacote — só funções puras, para poderem ser reusadas pelo mobile depois se fizer sentido

**Critério de aceite**: `pnpm --filter shared test` cobre as duas fórmulas de TMB com pelo menos um caso de referência publicado cada, mais casos de borda (idade/peso/altura extremos, ausência de % de gordura caindo no Mifflin-St Jeor em vez de quebrar).

---

### 11. Registro de medidas corporais (`body_measurements`)
**Contexto**: input necessário para o cálculo de metas (peso, e opcionalmente % de gordura para Katch-McArdle) — também é a base do gráfico de peso da Fase 3. Ver `docs/database-schema.md` e a regra de **nunca normalizar `source` entre aparelhos** em `CLAUDE.md`.

- [x] Migration `body_measurements` (`user_id`, `measured_at`, `source`, `weight_kg`, `body_fat_percent` nullable, `muscle_mass_kg`/`lean_mass_kg` nullable, `raw_payload` jsonb nullable) — FK `user_id → users` com `ON DELETE CASCADE`
- [x] `POST /v1/body-measurements` — registro manual (`source = 'manual'` obrigatório no MVP via `@IsIn`; outros valores do enum ficam reservados para quando a Fase 5 importar bioimpedância) — exige consentimento `privacy_policy` (`RequireConsentGuard`, mesmo padrão do `PATCH /v1/me/profile`)
- [x] `GET /v1/body-measurements?source=&from=&to=` — paginado (`{ data, meta: { total, page, limit } }`)
- [x] Validação: `source` sempre obrigatório e explícito, nunca inferido
- [x] Testes: criação, listagem filtrada por `source`/período, isolamento entre usuários, e2e do fluxo completo (7 casos) + unitários do service (7 casos)
- [x] `GET /v1/me/export` passou a incluir `bodyMeasurements` (LGPD — export precisa refletir todo dado pessoal existente, ver `CLAUDE.md`)

**Critério de aceite**: usuário registra peso manualmente e consegue listar o histórico filtrando por `source`; tentar comparar/agrupar `source`s diferentes não é feito silenciosamente em nenhum lugar do código (não há endpoint ou lógica que misture fontes sem filtro explícito).

---

### 12. Módulo de metas (`goals`)
**Contexto**: primeiro endpoint que usa o catálogo de calculadoras (issue 10) e o perfil + peso atual (issue 11) para virar TMB/TDEE/macros de verdade. Ver `docs/api-contract.md` (módulo `goals`).

- [x] Migration `goal_targets` (`profile_snapshot` jsonb, `calculation_method`, `bmr_kcal`, `tdee_kcal`, `target_kcal`, macros, `is_manual_override`, `active_from`) — nunca sobrescrever, sempre criar novo registro (linha nova a cada recálculo ou ajuste manual)
- [x] `GET /v1/goals/current` — meta ativa (404 com mensagem apontando pra `POST /v1/goals/recalculate` se ainda não existir)
- [x] `POST /v1/goals/recalculate` — usa perfil atual + medida corporal mais recente; aceita `method` opcional (default `mifflin_st_jeor`, ou `katch_mcardle` automaticamente se a medida mais recente tiver `body_fat_percent`); 400 claro se perfil incompleto ou se faltar medida corporal
- [x] `PATCH /v1/goals/current` — ajuste manual de macros/calorias (`is_manual_override = true`), preserva `bmr_kcal`/`tdee_kcal` calculados; 400 se nenhum campo for informado
- [x] `GET /v1/goals/history` — paginado (DTO de paginação extraído pra `common/dto/pagination-query.dto.ts`, reusado também por `body-measurements`)
- [x] Erro claro (400) se faltar dado obrigatório no perfil (ex. sem `birth_date`/`sex`/`height_cm`/`activity_level`/`goal`) — nunca calcula com dado ausente ou chutado
- [x] Testes: 15 unitários do serviço (perfil incompleto, sem medida corporal, seleção de método, wiring TMB→TDEE→target→macros, ajuste manual, paginação) + 6 e2e (fluxo completo recalcular → ler → ajustar → histórico → export)
- [x] `GET /v1/me/export` passou a incluir `goals` (mesmo padrão da issue 11)
- [x] `applyGoalAdjustment` novo em `packages/shared/src/calculators/` — déficit de 500kcal/dia pra `lose` (CDC) e superávit de 300kcal/dia pra `gain` (Iraki et al. 2019), aplicado sobre o TDEE antes de `distributeMacros` (renomeado `tdeeKcal`→`kcalBudget` pra refletir que recebe o orçamento pós-ajuste, não o TDEE bruto)

**Critério de aceite**: `POST /v1/goals/recalculate` com um perfil completo retorna TMB/TDEE/macros consistentes com a calculadora testada na issue 10; `PATCH` manual não é sobrescrito por um recálculo posterior sem ação explícita do usuário.

---

### 13. Catálogo de alimentos — schema + import TACO
**Contexto**: base de dados de alimentos brasileira, fonte primária e sempre disponível offline (sem depender de API externa). Ver ADR-0004.

- [ ] Migration `foods` (`source`, `external_id` nullable, `owner_user_id` nullable, `name`, `brand` nullable, `barcode` nullable indexado, macros por 100g, `fiber_g_per_100g` nullable, `search_vector`)
- [ ] Migration `food_portions` (`food_id`, `label`, `grams`)
- [ ] Extensões Postgres: `pg_trgm` + `unaccent`, índice GIN em `name`
- [ ] Script de seed: importar TACO (Unicamp) para `foods` com `source = 'taco'` — rodar uma vez, documentar como reexecutar
- [ ] Atribuição: nota de crédito à TACO/Unicamp já prevista para a tela de "Sobre" do mobile (não bloqueia esta issue, só não pode ser esquecida — ver `CLAUDE.md`)
- [ ] `POST /v1/foods`, `PATCH /v1/foods/:id`, `DELETE /v1/foods/:id` — só para alimentos `owner_user_id = usuário atual` (cadastro personalizado, sem busca compartilhada entre usuários no MVP — ver `product-plan.md` seção 2)

**Critério de aceite**: seed roda do zero num banco limpo e popula `foods` com os ~600 itens da TACO; usuário consegue cadastrar um alimento próprio e só ele o vê.

---

### 14. Busca de alimentos + integração sob demanda com Open Food Facts
**Contexto**: depende do schema da issue 13. Ver ADR-0004 — sem bulk import do OFF, só cache sob demanda.

- [ ] `GET /v1/foods/search?q=&page=` — trigram + `unaccent` sobre `foods.name`, ranqueado por similaridade
- [ ] Fallback: se a busca local não retornar resultado relevante, consultar a API pública do Open Food Facts
- [ ] Cache do resultado do OFF na primeira vez que for usado (`source = 'off'`, `external_id` = código do produto)
- [ ] `GET /v1/foods/:id`
- [ ] Rate limiting técnico geral no endpoint de busca (evitar abuso/scraping via nosso proxy do OFF)
- [ ] Testes: busca com erro de digitação/acento encontra o item certo; item do OFF já cacheado não gera nova chamada externa

**Critério de aceite**: buscar "arros" (sem acento, com erro) encontra "Arroz, integral, cozido" da TACO; buscar um produto de marca que só existe no OFF retorna resultado e fica cacheado localmente na consulta seguinte.

---

### 15. Diário alimentar (`diary`)
**Contexto**: depende do catálogo de alimentos (issue 13/14) e do módulo de metas (issue 12) para o resumo vs. meta. Ver `docs/api-contract.md` (módulo `diary`) e a simplificação de escopo em `product-plan.md` (cópia de dia inteiro no MVP, não de refeição individual).

- [ ] Migration `diary_entries` (`food_id`, `entry_date`, `meal_type`, `quantity`, `unit`, `portion_id` nullable, snapshots de macros no momento do registro)
- [ ] `POST /v1/diary` — grava os snapshots de macros a partir do `food_id` no momento da criação (nunca recalcula retroativamente se o alimento for editado depois)
- [ ] `GET /v1/diary?date=YYYY-MM-DD` — entradas agrupadas por refeição + resumo (kcal/macros vs. meta ativa da issue 12)
- [ ] `PATCH /v1/diary/:id`, `DELETE /v1/diary/:id`
- [ ] `POST /v1/diary/copy` — duplica todas as entradas de `from_date` para `to_date` (dia inteiro, não refeição individual — MVP)
- [ ] Testes: normalização de porções (grams vs. `food_portions`) e o resumo diário batendo com a soma dos snapshots, não com os dados atuais do alimento

**Critério de aceite**: registrar um alimento, editar o alimento original depois, e conferir que a entrada já registrada no diário mantém os valores antigos (snapshot); `POST /v1/diary/copy` duplica um dia inteiro corretamente; resumo diário reflete a meta ativa do usuário.

---

## Fora de escopo desta fase (confirmado em `product-plan.md`)
- Múltiplos objetivos simultâneos — um `goal` ativo por vez.
- Duplicar refeição individual — só dia inteiro.
- Busca full-text compartilhada entre usuários para alimentos customizados.
