# Minha Saúde

App mobile de nutrição e acompanhamento de saúde — diário alimentar (base TACO + Open Food Facts) e análise de exames de sangue/bioimpedância com IA. Projeto de portfólio com usuários reais desde a Fase 1.

Planejamento completo em [`CLAUDE.md`](./CLAUDE.md) e [`docs/`](./docs) — decisões de arquitetura (ADRs), modelagem de banco, contrato de API, roadmap e backlog.

## Stack

- **Backend**: NestJS + TypeORM + PostgreSQL
- **Mobile**: React Native (Expo, Expo Router, EAS Build)
- **Monorepo**: pnpm workspaces + Turborepo
- **Hosting** (orçamento zero, ver [ADR-0007](docs/adr/0007-hosting-orcamento-zero-render-supabase-r2.md)): Render (API) + Supabase (Postgres) + Cloudflare R2 (arquivos)

## Estrutura

```
apps/api/       - backend NestJS
apps/mobile/    - app Expo/React Native
packages/shared/  - tipos, enums, schemas Zod, catálogo de calculadoras
packages/config/  - eslint/prettier/tsconfig compartilhados
docs/           - planejamento: ADRs, modelagem, contrato de API, roadmap, backlog
```

## Setup local

Pré-requisitos: Node.js >= 24, [pnpm](https://pnpm.io/installation) >= 9, Docker (Postgres local).

```bash
pnpm install         # instala e linka todos os workspaces
docker compose up -d  # Postgres local (ver docker-compose.yml)
pnpm build            # turbo run build em todos os workspaces
pnpm lint              # turbo run lint em todos os workspaces
pnpm test               # turbo run test em todos os workspaces
```

Cada workspace individual roda via `pnpm --filter <nome> <script>`, ex.: `pnpm --filter @minhasaude/api dev`. Setup detalhado da API (env, migrations, seed) em [`apps/api/README.md`](apps/api/README.md).

## Deploy

- **API**: https://minhasaude-api.onrender.com (Render free tier — "dorme" após 15 min sem tráfego, primeiro request depois disso leva 30-60s pra acordar; ver [ADR-0007](docs/adr/0007-hosting-orcamento-zero-render-supabase-r2.md))
- **Swagger**: https://minhasaude-api.onrender.com/docs
- **Banco**: Postgres no Supabase (São Paulo), acessado via connection pooler (o host direto só resolve por IPv6, que o Render não suporta em saída)
- **Arquivos**: bucket `minhasaude-exams` no Cloudflare R2
- Cron diário (`.github/workflows/keep-alive.yml`) consulta `/health` (que faz `SELECT 1` no Postgres) para evitar a pausa do projeto Supabase free tier por inatividade.
- ⚠️ **Auto-deploy do Render**: status incerto desde 2026-09-18 — o dashboard mostra `Auto-Deploy: On Commit` configurado, mas isso ainda não foi reconfirmado por um push real disparando deploy sozinho (histórico da Fase 1 era de que o GitHub App não estava autorizado no repo e o webhook não disparava). Até confirmar, mantenha o deploy manual como fallback: `curl -X POST -H "Authorization: Bearer $RENDER_API_KEY" https://api.render.com/v1/services/srv-dam2ng6k1f9s73e8ok1g/deploys` (ou botão "Manual Deploy" no dashboard). Se o próximo push não disparar deploy, conectar o GitHub App em Settings do serviço → Build & Deploy (ou Account Settings → GitHub).
- `buildCommand` do serviço: `pnpm install --frozen-lockfile --prod=false && pnpm exec turbo run build --filter=@minhasaude/api` — usa o `turbo run build`, não `pnpm --filter api build` sozinho, porque `@minhasaude/api` depende de `@minhasaude/shared` ser compilado primeiro (`turbo.json` já modela essa ordem via `dependsOn: ["^build"]`).

## Status

Fase 1 (Fundação) em andamento — ver [`docs/backlog-fase1.md`](docs/backlog-fase1.md) e [`docs/roadmap.md`](docs/roadmap.md).
