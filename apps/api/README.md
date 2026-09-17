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
- Health check: `http://localhost:3000/health`

### Migrations

```bash
pnpm --filter @minhasaude/api migration:generate src/database/migrations/NomeDaMigration  # gera a partir do diff das entities
pnpm --filter @minhasaude/api migration:run       # aplica
pnpm --filter @minhasaude/api migration:revert    # desfaz a última
```

Nunca usar `synchronize: true` — todo schema muda via migration versionada (ver `CLAUDE.md`).

Arquitetura, contrato de API e modelagem de dados: ver `/docs` na raiz do monorepo.
