# Contrato Inicial da API (principais endpoints por módulo)

Convenções: prefixo `/v1`, respostas no envelope padrão (`success`, `data`, `error`, `meta` para paginação), auth via `Authorization: Bearer <jwt>` exceto onde marcado público.

## auth
- `POST /v1/auth/register` — cria conta (email, senha)
- `POST /v1/auth/login` — retorna access + refresh token
- `POST /v1/auth/refresh` — rotaciona refresh token
- `POST /v1/auth/logout` — revoga refresh token atual
- `POST /v1/auth/verify-email` (público, via token)

## users / profile
- `GET /v1/me` — dados da conta + perfil
- `PATCH /v1/me/profile` — atualiza peso, altura, idade, sexo, nível de atividade, objetivo
- `DELETE /v1/me` — inicia exclusão de conta (LGPD, ver módulo consents)
- `GET /v1/me/export` — exporta todos os dados do usuário (LGPD, ver módulo consents)

## goals
- `GET /v1/goals/current` — meta ativa (TMB, TDEE, macros)
- `POST /v1/goals/recalculate` — recalcula a partir do perfil atual (aceita `method` opcional)
- `PATCH /v1/goals/current` — ajuste manual de macros/calorias
- `GET /v1/goals/history` — histórico de metas

## foods
- `GET /v1/foods/search?q=&page=` — busca (local + fallback Open Food Facts sob demanda)
- `GET /v1/foods/:id`
- `POST /v1/foods` — cadastro de alimento personalizado (owner = usuário atual)
- `PATCH /v1/foods/:id` — só se owner
- `DELETE /v1/foods/:id` — só se owner

## diary
- `GET /v1/diary?date=YYYY-MM-DD` — entradas do dia agrupadas por refeição + resumo (kcal/macros vs meta)
- `POST /v1/diary` — adiciona entrada (food_id, quantity, unit, meal_type, date)
- `PATCH /v1/diary/:id`
- `DELETE /v1/diary/:id`
- `POST /v1/diary/copy` — copia todas as entradas de `from_date` para `to_date`

## exams
- `POST /v1/exams` — upload (multipart), cria `exam_document` com status `pending`, enfileira extração
  - **Regra de negócio**: limite de **1 upload por `exam_type` a cada 30 dias por usuário** (controle de custo de IA — retorna 429 com data de liberação se excedido). Período de 30 dias é o default assumido; ajustável por config.
- `GET /v1/exams/:id` — status + resultados brutos extraídos
- `GET /v1/exams` — histórico paginado
- `PATCH /v1/exams/:id/results` — usuário confirma/corrige valores extraídos (obrigatório antes de virar histórico oficial)
- `DELETE /v1/exams/:id`

## metrics (índices calculados)
- `GET /v1/metrics/catalog` — lista calculadoras disponíveis, inputs necessários, referência bibliográfica
- `GET /v1/metrics?code=&from=&to=` — histórico de um índice calculado
- `POST /v1/metrics/recalculate` — força recálculo (ex. após revisão de exame)

## body-measurements
- `GET /v1/body-measurements?source=&from=&to=`
- `POST /v1/body-measurements` — registro manual (peso) ou importado de bioimpedância

## consents
- `GET /v1/consents` — status atual de cada tipo de consentimento
- `POST /v1/consents` — registra aceite (consent_type, policy_version)
- `DELETE /v1/consents/:type` — revoga (ex. consentimento de exames)

## Observações de contrato
- Todo endpoint de escrita relacionado a exames/saúde deve checar consentimento ativo antes de processar (`exam_data_processing`).
- Endpoints de upload de exame têm rate limiting duplo: o limite de negócio (1 por tipo/30 dias, acima) e um rate limit técnico geral (nestjs-throttler) contra abuso/scripts.
- Paginação padrão: `page`, `limit`, resposta com `meta: { total, page, limit }`.
- Projeto tem usuários reais desde a Fase 1 (não é só ambiente de portfólio isolado) — todo endpoint novo entra já com ValidationPipe estrito, guard de auth por padrão (allowlist explícita do que é público) e rate limiting, nunca "depois". Ver `CLAUDE.md`.
