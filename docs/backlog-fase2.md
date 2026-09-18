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

- [x] Migration `foods` (`source`, `external_id` nullable, `owner_user_id` nullable, `name`, `brand` nullable, `barcode` nullable indexado, macros por 100g, `fiber_g_per_100g` nullable, `search_vector`) — `search_vector` é coluna gerada (`STORED`, `to_tsvector('portuguese', name)`); `unaccent()` não entra na expressão porque não é `IMMUTABLE` (Postgres recusaria a coluna gerada) — fuzzy/acento fica com o índice trigram, resolvido na prática na issue #14
- [x] Migration `food_portions` (`food_id`, `label`, `grams`)
- [x] Extensões Postgres: `pg_trgm` + `unaccent` habilitadas; índice GIN em `search_vector` e índice GIN trigram (`gin_trgm_ops`) em `name` — ambos via SQL bruto na migration (TypeORM não modela operator class declarativamente)
- [x] Script de seed (`pnpm --filter @minhasaude/api seed:taco`): CSV oficial da TACO 4ª edição (NEPA/Unicamp) reaproveitado de um repositório MIT (`ThiagoCarreiraVallim/fatia`, via GitHub code search) salvo em `src/database/seeds/data/taco.csv`; idempotente por `(source=taco, external_id)`. **582 de 597 itens importados** — 15 ignorados por terem proteína/carboidrato/kcal marcados `NA` (não medido) na fonte original (ex. óleos puros, leite integral/desnatado): nunca fabricamos `0` para dado que a TACO não mediu, só pulamos o item e logamos quais foram
- [x] Atribuição: nota de crédito à TACO/NEPA/Unicamp adicionada em `apps/api/README.md`; lembrete explícito de manter na tela de "Sobre" do mobile quando ela existir (Fase 3) — ver `CLAUDE.md`
- [x] `POST /v1/foods`, `PATCH /v1/foods/:id`, `DELETE /v1/foods/:id` — `source`/`owner_user_id` sempre definidos pelo servidor (nunca aceitos do DTO); editar/remover alimento de outro dono **ou do sistema** (TACO/OFF) retorna 404, não 403 (evita revelar existência do recurso a quem não pode mexer nele)
- [x] `GET /v1/foods/:id` também implementado (não estava no checklist original, mas é pré-requisito pra "só ele o vê" ser testável) — TACO/OFF públicos, custom só pro dono
- [x] Testes: 12 unitários do service + 4 e2e (forjar `source` no DTO rejeitado por whitelist, dono vê/edita/remove, outro usuário recebe 404 em tudo, alimento inexistente 404)

**Critério de aceite**: seed roda do zero num banco limpo e popula `foods` com os ~600 itens da TACO (582 confirmados, testado do zero e reexecutado pra confirmar idempotência); usuário consegue cadastrar um alimento próprio e só ele o vê (confirmado via e2e com dois usuários).

---

### 14. Busca de alimentos + integração sob demanda com Open Food Facts
**Contexto**: depende do schema da issue 13. Ver ADR-0004 — sem bulk import do OFF, só cache sob demanda.

- [x] `GET /v1/foods/search?q=&page=&limit=` — trigram (`word_similarity`/`<%`) + `unaccent` sobre `foods.name`, ranqueado por similaridade. Precisou de uma função `immutable_unaccent()` (wrapper IMMUTABLE do `unaccent()`, que sozinho não pode ser usado em índice) e um índice GIN funcional sobre `immutable_unaccent(lower(name))` — confirmado via `EXPLAIN` que o índice é de fato usado
- [x] Fallback: busca local vazia consulta a API pública do Open Food Facts (`cgi/search.pl`, única com full-text search — a v2/v3 só filtra por tag estruturada, confirmado testando ao vivo contra a API real)
- [x] Cache do resultado do OFF na primeira vez que for usado (`source = 'off'`, `external_id`/`barcode` = código do produto) — índice único parcial `(source, external_id) WHERE external_id IS NOT NULL` evita duplicar cache em buscas concorrentes; produto do OFF sem kcal/proteína/gordura/carboidrato medido é ignorado, mesma política de nunca fabricar dado da issue #13
- [x] `GET /v1/foods/:id` (já entregue na issue #13)
- [x] Rate limiting técnico geral no endpoint de busca — 20/min via `@Throttle`, mais restrito que o default global (60/min) porque cada busca sem cache dispara uma chamada de saída pro OFF
- [x] Testes: 5 unitários novos de `search`/cache (17 no total do `FoodsService`) + 4 e2e (acha "Arroz, integral, cozido" buscando "arros"; acha "Açúcar" buscando "acucar" sem acento; não vaza alimento custom de outro usuário na busca; rejeita `q` com menos de 2 caracteres) + verificação manual ao vivo contra a API real do OFF (busca "nutella" cacheou 4 produtos reais; segunda busca voltou só do cache local, sem nova chamada externa)

**Critério de aceite**: buscar "arros" (sem acento, com erro) encontra "Arroz, integral, cozido" da TACO — confirmado; buscar um produto de marca que só existe no OFF retorna resultado e fica cacheado localmente na consulta seguinte — confirmado ao vivo.

**Achado importante desta issue** (não fazia parte do escopo, mas bloqueava produção): `packages/shared` nunca tinha sido de fato compilado — o script `build` era um `echo` placeholder desde a Fase 1, então `node dist/main.js` (como a API roda em produção) não conseguia resolver `@minhasaude/shared` em runtime. Passou despercebido nas issues #10-#13 porque testes rodam via `ts-jest`/`ts-node`, que resolvem `.ts` direto. Corrigido: `packages/shared` agora tem `tsconfig.build.json` (exclui specs) e `pnpm --filter shared build` gera `dist/` de verdade; `package.json` do pacote aponta `main`/`types` pra lá.

**Resolvido em produção (2026-09-18)**: o `buildCommand` do serviço no Render foi só `pnpm install --frozen-lockfile --prod=false && pnpm --filter @minhasaude/api build` — não buildava o `shared`. Atualizado via API (`PATCH /v1/services/:id`) para `pnpm install --frozen-lockfile --prod=false && pnpm exec turbo run build --filter=@minhasaude/api` (usa o `turbo.json`, que já respeita `dependsOn: ["^build"]` — builda `shared` automaticamente antes da API, e continua correto se mais pacotes compartilhados surgirem). Deploy manual disparado pra validar: `live` em ~74s, `GET /health` e `/docs` responderam 200 em produção. Auto-deploy no push (`autoDeployTrigger: commit`) aparenta já estar configurado — status real só confirmado no próximo push de verdade (issue #15).

---

### 15. Diário alimentar (`diary`)
**Contexto**: depende do catálogo de alimentos (issue 13/14) e do módulo de metas (issue 12) para o resumo vs. meta. Ver `docs/api-contract.md` (módulo `diary`) e a simplificação de escopo em `product-plan.md` (cópia de dia inteiro no MVP, não de refeição individual).

- [x] Migration `diary_entries` (`food_id`, `entry_date`, `meal_type`, `quantity`, `unit`, `portion_id` nullable, snapshots de macros no momento do registro) — `food_id` sem `onDelete` (bloqueia apagar alimento com histórico de diário); teve que editar a migration gerada à mão pra remover DROP INDEX indevido nos índices de busca da issue #14 (não modelados na entidade, TypeORM tentou "corrigir drift")
- [x] `POST /v1/diary` — snapshot calculado a partir do `food_id` (via `FoodsService.findById`, respeitando a mesma visibilidade custom/dono) no momento da criação; nunca recalcula retroativamente
- [x] `GET /v1/diary?date=YYYY-MM-DD` — entradas agrupadas por refeição + resumo `{ consumed, target, remaining }` (target/remaining `null` se o usuário ainda não calculou meta - estado válido, não erro)
- [x] `PATCH /v1/diary/:id`, `DELETE /v1/diary/:id` — só o dono; trocar `unit` pra `grams` sempre limpa `portionId`; só resnapshota se algo que afeta o cálculo mudou
- [x] `POST /v1/diary/copy` — duplica `from_date` → `to_date`, resnapshotando a partir do alimento atual (é uma entrada nova, não uma correção retroativa da origem)
- [x] `GET /v1/me/export` passou a incluir `diaryEntries` (mesmo padrão das issues 11/12)
- [x] Testes: 13 unitários (cálculo por grams/porção, rejeição de porção de outro alimento, `unit→grams` limpa portionId, resumo não recalcula do alimento atual) + 6 e2e (snapshot congela após editar o alimento, copy resnapshota do estado atual, isolamento entre usuários, remoção, export)

**Critério de aceite**: confirmado — snapshot mantém valores antigos após editar o alimento original; `copy` duplica o dia inteiro; resumo reflete a meta ativa quando existe.

---

## Fora de escopo desta fase (confirmado em `product-plan.md`)
- Múltiplos objetivos simultâneos — um `goal` ativo por vez.
- Duplicar refeição individual — só dia inteiro.
- Busca full-text compartilhada entre usuários para alimentos customizados.
