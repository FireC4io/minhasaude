# CLAUDE.md — Minha Saúde

App mobile de nutrição e acompanhamento de saúde (inspirado no MyFitnessPal, sem usar esse nome), com diferencial de análise de exames de sangue e bioimpedância. Projeto de portfólio **e** com usuários reais desde a Fase 1 — não é só um exercício isolado, então segurança e LGPD não são "depois". Público brasileiro, app em português. Desenvolvedor solo, sem prazo fixo, orçamento de infra R$0 por enquanto (ver ADR-0007).

## Arquitetura
- Monorepo: pnpm workspaces + Turborepo (`apps/api`, `apps/mobile`, `packages/shared`, `packages/config`).
- Backend: NestJS + TypeORM + PostgreSQL, padrão Repository (domínio desacoplado do ORM).
- Mobile: React Native com Expo (Expo Router, EAS Build).
- Tipos compartilhados: OpenAPI como fonte da verdade do contrato HTTP + codegen de client para o mobile; `packages/shared` para enums/schemas Zod de domínio.
- Hosting (orçamento zero, ver ADR-0007): API no Render free tier, Postgres no Supabase free tier, arquivos de exame no Cloudflare R2 free tier. Tudo atrás de env vars — trocar de provedor pago não deve exigir mudança de código.
- Ver decisões completas e alternativas descartadas em `docs/adr/`.
- Modelagem de dados em `docs/database-schema.md`, contrato de API em `docs/api-contract.md`.

## Comandos
```bash
pnpm install                          # instala tudo no monorepo
pnpm --filter api start:dev           # roda API local
pnpm --filter api migration:run       # aplica migrations
pnpm --filter api migration:generate  # gera migration a partir de mudança de entidade
pnpm --filter mobile start            # roda Expo dev server
turbo run lint test build             # pipeline completo (usado no CI)
```

## Regras de segurança e LGPD (obrigatórias em toda sessão — projeto tem usuários reais desde a Fase 1, segurança nunca é "depois")
- Dados de saúde (exames, medidas corporais) são **dados pessoais sensíveis** — qualquer feature nova que os toque precisa checar consentimento ativo (`consents`) antes de processar.
- Nunca logar payload de exame, senha, token ou dado de perfil de saúde — usar redact no Pino.
- Nunca sobrescrever `exam_results.raw_value`/`raw_unit` — são o dado extraído originalmente, imutável. Valores confirmados vão em `confirmed_*`.
- `body_measurements.source` é obrigatório e nunca "normalizado" entre aparelhos de bioimpedância diferentes — não implementar comparação direta entre fontes distintas sem aviso explícito na UI.
- Qualquer texto de UI relacionado a resultado de exame/índice calculado deve ser informativo, nunca diagnóstico ou prescritivo (RDC 657/2022 — ver `docs/product-plan.md` seção 5). Não implementar lógica do tipo "se X > limite, recomendamos Y".
- Toda calculadora de índice de saúde (`packages/shared/src/calculators/`) precisa gravar `calculator_version` no resultado — histórico não pode mudar retroativamente se a fórmula for corrigida.
- Senhas com argon2 (nunca bcrypt puro sem custo adequado, nunca MD5/SHA sozinho). JWT de acesso curto + refresh token rotacionado e revogável.
- Arquivos de exame: sempre via URL assinada temporária, nunca URL pública direta ao bucket.
- Atribuição obrigatória de dados: TACO/Unicamp e Open Food Facts (licença ODbL) — não remover créditos ao alterar telas de "sobre".
- Upload de exame: limite de negócio de 1 por `exam_type` a cada 30 dias por usuário (controle de custo de IA), além de rate limiting técnico geral.
- Baseline de segurança obrigatória desde a Fase 1 (não é opcional para depois): `helmet` no NestJS, `nestjs-throttler` global (mais restritivo em `/auth/*` e `/exams`), ValidationPipe com `whitelist`+`forbidNonWhitelisted` em todo endpoint novo, guard de auth por padrão (rotas públicas são allowlist explícita, nunca o contrário), `pnpm audit`/Dependabot rodando em CI.
- Endpoints de exportação (`GET /v1/me/export`) e exclusão (`DELETE /v1/me`) de conta precisam ser **funcionais de verdade na Fase 1**, não stub — há usuários reais desde o início.

## Convenções de código
- Seguir `rules/common/coding-style.md`: imutabilidade, arquivos pequenos (200-400 linhas típico, 800 máximo), Repository pattern, validação em toda borda do sistema com Zod/class-validator.
- Nomes de entidades/variáveis em inglês; textos de UI em português (pt-BR).
- Migrations do TypeORM sempre geradas, nunca `synchronize: true` fora de teste local isolado.
- Testes: TDD para lógica de negócio crítica (cálculo de metas, normalização de exames, calculadoras de índices) — não exigir 80% de cobertura em CRUD trivial, priorizar qualidade sobre número.

## O que este projeto NÃO faz (fora de escopo até indicação contrária)
- Diagnóstico médico ou recomendação de tratamento/dosagem.
- Comparação direta de bioimpedância entre aparelhos diferentes.
- Import em massa do Open Food Facts (busca é sob demanda — ver ADR-0004).
- Funcionalidades sociais, gráficos avançados, leitor de código de barras, registro de treinos — reservado para Fase 6 (`docs/roadmap.md`).

## Active Context (última sessão: 2026-09-17)
- **Fase 1**: Issues #1-#7, #9 concluídas e verificadas ao vivo. Falta apenas **#8** (observabilidade — Pino já configurado com redact desde a Issue 2, falta integrar BetterStack de verdade, que exige criar a conta externa).
- **Fase 2 iniciada**: backlog completo em `docs/backlog-fase2.md` (issues #10-#15).
  - **Issue #10 concluída** — catálogo de calculadoras de gasto energético (`packages/shared/src/calculators/`): Mifflin-St Jeor, Katch-McArdle, TDEE por `activity_level`, distribuição de macros por objetivo. 14 testes unitários com valores conferidos contra a literatura (fórmulas verificadas via busca web na sessão, não só memorizadas). Pacote `@minhasaude/shared` ganhou infra de verdade (jest+ts-jest, eslint, tsconfig) — antes era só placeholder.
  - **Issue #11 concluída** — módulo `body-measurements` (`POST`/`GET /v1/body-measurements`, paginado, filtrável por `source`/período). `POST` exige consentimento `privacy_policy` via `RequireConsentGuard` (dado de saúde, ver regra do `CLAUDE.md`). `source='manual'` é o único aceito no MVP (`@IsIn`), enum já tem `inbody`/`tanita`/`omron`/`other` reservados pra Fase 5. `GET /v1/me/export` agora inclui `bodyMeasurements`. Migration gerada via `migration:generate` (não escrita à mão) e aplicada localmente. 14 testes novos (7 unitários + 7 e2e), todos verdes.
  - **Issue #12 concluída** — módulo `goals` (TMB/TDEE/macros de verdade, usando o catálogo de calculadoras da #10 + o peso/`.` mais recente da #11). `POST /v1/goals/recalculate` escolhe `katch_mcardle` automaticamente se houver `body_fat_percent` recente, senão `mifflin_st_jeor`; 400 claro se perfil incompleto ou sem medida corporal (nunca calcula com dado chutado). `PATCH /v1/goals/current` sempre cria uma linha nova (nunca sobrescreve — histórico de cálculo é imutável). Novo `applyGoalAdjustment` em `packages/shared` (déficit 500kcal/dia CDC pra `lose`, superávit 300kcal/dia pra `gain`, ambos verificados via busca web) — isso exigiu renomear `distributeMacros({ tdeeKcal })` → `{ kcalBudget }` no pacote compartilhado (breaking rename interno, sem consumidores externos, ok). `GET /v1/me/export` agora inclui `goals`. DTO de paginação extraído pra `common/dto/pagination-query.dto.ts` (reusado por `body-measurements` e `goals`). 21 testes novos (15 unitários + 6 e2e), todos verdes.
- **Próximo passo natural**: Issue #13 (catálogo de alimentos — schema + import TACO), que não depende de #10-#12 e libera #14/#15, conforme `docs/backlog-fase2.md`.
- **Issue #9 concluída nesta sessão**: `helmet` no bootstrap (testado manualmente — CSP `script-src 'self'` não quebra o Swagger UI, que só usa `<script src>` same-origin); throttle de 5/min em `/v1/auth/register`, `/login` e `/refresh` (testado ao vivo: 6ª tentativa de login em 1 min retorna 429); CORS já era restrito via `CORS_ORIGINS`; `pnpm audit --audit-level=high` novo job no CI; `.github/dependabot.yml` criado (npm + github-actions, semanal). `/v1/exams` fica de fora do throttling diferenciado porque o endpoint só existe na Fase 5 — revisitar quando o upload de exame for implementado.
- **Overrides de segurança em `package.json` raiz** (`pnpm.overrides`): `multer >=2.3.0`, `js-yaml >=4.3.2`, `path-to-regexp >=8.4.0`, `lodash >=4.18.0` — todas vulnerabilidades transitivas via `@nestjs/platform-express`/`@nestjs/swagger`/`@nestjs/cli`, não dependências diretas. `pnpm audit --audit-level=high` está limpo agora; reavaliar os overrides quando o Nest atualizar essas transitivas nativamente.
- **Produção real**: https://minhasaude-api.onrender.com, Postgres no Supabase (`sa-east-1`, via session pooler — o host direto é IPv6-only e o Render não tem saída IPv6), bucket R2 `minhasaude-exams`.
- **Pendência conhecida**: auto-deploy do Render não dispara sozinho no push (GitHub App nunca foi autorizado no repo, só o login OAuth) — cada push precisa de `POST .../deploys` manual via API até isso ser conectado no dashboard. Ver README raiz.
- **Gotcha de plataforma**: NestJS 12, `@nestjs/jwt` 12, `@nestjs/typeorm` 12 são todos ESM-only (`"type":"module"`) e quebram Jest — o projeto está fixado nas versões `11.x`/legacy de cada pacote Nest. Verificar isso antes de atualizar qualquer dependência `@nestjs/*`.
- **Próximo passo natural**: Issue #8 ou #9 (nenhuma depende de conta externa nova).

## Referências
- Plano completo: `docs/product-plan.md`
- ADRs: `docs/adr/`
- Roadmap: `docs/roadmap.md`
- Backlog Fase 1: `docs/backlog-fase1.md`
