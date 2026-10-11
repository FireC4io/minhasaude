# Estrutura de Pastas Proposta (Monorepo)

```
minha-saude/
├── apps/
│   ├── api/                          # NestJS
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # login, refresh, guards, strategies
│   │   │   │   ├── users/            # conta, perfil
│   │   │   │   ├── goals/            # TMB, macros, metas
│   │   │   │   ├── foods/            # catálogo, busca, cadastro custom
│   │   │   │   ├── diary/            # diário alimentar, refeições
│   │   │   │   ├── exams/            # upload, extração, revisão
│   │   │   │   ├── metrics/          # catálogo de calculadoras + resultados
│   │   │   │   ├── consents/         # LGPD: consentimentos, exportação, exclusão
│   │   │   │   └── files/            # storage (R2), URLs assinadas
│   │   │   ├── common/               # filters, interceptors, pipes, decorators
│   │   │   ├── config/               # validação de env (zod/joi), typed config
│   │   │   ├── database/             # data source, migrations, seeds
│   │   │   └── main.ts
│   │   ├── test/                     # e2e (supertest)
│   │   └── migrations/
│   │
│   └── mobile/                       # Expo (Expo Router)
│       ├── app/                      # rotas (file-based routing)
│       ├── src/
│       │   ├── features/             # onboarding, diary, exams, profile
│       │   ├── components/
│       │   ├── api/                  # client gerado do OpenAPI + hooks (TanStack Query)
│       │   ├── stores/               # estado local (Zustand)
│       │   └── theme/
│       └── app.config.ts
│
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── schemas/              # Zod: perfil, diário, exame
│   │   │   ├── enums/                # unidades, tipos de refeição, faixas
│   │   │   └── calculators/          # catálogo de calculadoras (ver database-schema.md)
│   │   └── package.json
│   └── config/                       # eslint, tsconfig, prettier compartilhados
│
├── docs/
│   ├── adr/
│   ├── product-plan.md
│   ├── database-schema.md
│   ├── api-contract.md
│   ├── roadmap.md
│   └── backlog-fase1.md
│
├── .github/
│   └── workflows/                    # ci.yml (lint, test, build), deploy.yml
│
├── turbo.json
├── pnpm-workspace.yaml
├── CLAUDE.md
└── README.md
```

**Convenção**: cada módulo do Nest segue o padrão Repository — `domain/` (interfaces, entidades de domínio puras) e `infrastructure/` (implementação TypeORM), conforme regra de projeto. Regra de arquivo: 200-400 linhas típico, 800 máximo — módulos maiores (ex. `exams`) devem ser quebrados em submódulos (`exams/upload`, `exams/extraction`, `exams/review`).
