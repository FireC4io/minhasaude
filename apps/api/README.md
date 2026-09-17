# @minhasaude/api

Backend NestJS + TypeORM + PostgreSQL.

## Setup local

```bash
cp .env.example .env
docker compose up -d          # Postgres local (raiz do monorepo)
pnpm --filter @minhasaude/api migration:run
pnpm --filter @minhasaude/api seed     # cria usuário de teste (ver saída do comando para a senha)
pnpm --filter @minhasaude/api start:dev
```

- Swagger: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health` (público)

### Autenticação

Todas as rotas exigem `Authorization: Bearer <accessToken>` por padrão — rotas públicas usam o decorator `@Public()` (ver `src/auth/decorators/public.decorator.ts`).

- `POST /v1/auth/register` (público) — `{ email, password }`
- `POST /v1/auth/login` (público, rate limit 5/min) — retorna `{ accessToken, refreshToken, expiresInSeconds }`
- `POST /v1/auth/refresh` (público) — rotação: o refresh token usado é revogado e um par novo é emitido
- `POST /v1/auth/logout` (autenticado) — revoga o refresh token informado no corpo
- `GET /v1/auth/me` (autenticado) — retorna o payload do access token

### Migrations

```bash
pnpm --filter @minhasaude/api migration:generate src/database/migrations/NomeDaMigration  # gera a partir do diff das entities
pnpm --filter @minhasaude/api migration:run       # aplica
pnpm --filter @minhasaude/api migration:revert    # desfaz a última
```

Nunca usar `synchronize: true` — todo schema muda via migration versionada (ver `CLAUDE.md`).

Arquitetura, contrato de API e modelagem de dados: ver `/docs` na raiz do monorepo.
