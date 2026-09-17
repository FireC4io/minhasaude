# @minhasaude/api

Backend NestJS + TypeORM + PostgreSQL.

## Setup local

```bash
cp .env.example .env
pnpm --filter @minhasaude/api start:dev
```

- Swagger: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health`

Banco de dados (TypeORM + migrations) chega na Issue 3 — por enquanto `DATABASE_URL` pode ficar vazio.

Arquitetura, contrato de API e modelagem de dados: ver `/docs` na raiz do monorepo.
