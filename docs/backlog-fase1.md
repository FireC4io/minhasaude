# Backlog — Fase 1 (formato de issues do GitHub)

> Copiar cada bloco como uma issue quando o repositório GitHub existir. `gh issue create` pode automatizar isso depois.

---

### 1. Setup do monorepo (pnpm + Turborepo)
**Contexto**: base do repositório antes de qualquer código de app. Ver ADR-0001.

- [ ] Inicializar repo git, `.gitignore` (node_modules, dist, .env, EAS artifacts)
- [ ] `pnpm-workspace.yaml` com `apps/*` e `packages/*`
- [ ] `turbo.json` com pipelines `build`, `lint`, `test`
- [ ] `packages/config` com eslint/prettier/tsconfig base compartilhados
- [ ] README raiz com instruções de setup local

**Critério de aceite**: `pnpm install` na raiz resolve todos os workspaces; `turbo run lint` roda (mesmo que vazio) sem erro.

---

### 2. Skeleton da API NestJS
**Contexto**: base do backend, replicando padrões já validados em outros projetos (Swagger, ValidationPipe, CORS).

- [ ] `apps/api` via Nest CLI
- [ ] Config module com validação de env (zod)
- [ ] ValidationPipe global (whitelist + forbidNonWhitelisted)
- [ ] Swagger em `/docs`
- [ ] CORS configurado por env
- [ ] Pino como logger, formato JSON estruturado
- [ ] Health check endpoint (`GET /health`)

**Critério de aceite**: `pnpm --filter api start:dev` sobe a API, `/docs` mostra Swagger UI, `/health` retorna 200.

---

### 3. Postgres + TypeORM + migrations
**Contexto**: infraestrutura de dados local e de CI. Ver `docs/database-schema.md`.

- [ ] Docker Compose com Postgres para dev local
- [ ] TypeORM data source configurado (sem `synchronize: true` em nenhum ambiente)
- [ ] Primeira migration: `users`, `refresh_tokens`, `profiles`
- [ ] Script de seed básico (usuário de teste)

**Critério de aceite**: `pnpm --filter api migration:run` aplica migrations do zero num Postgres limpo sem erro.

---

### 4. Módulo de autenticação
**Contexto**: base de segurança de todo o resto do sistema.

- [ ] Registro (email + senha, hash com argon2)
- [ ] Login (retorna access token JWT curto + refresh token)
- [ ] Refresh token com rotação (invalida o anterior ao usar)
- [ ] Logout (revoga refresh token)
- [ ] Guard JWT aplicado por padrão, rotas públicas explícitas via decorator
- [ ] Rate limiting no login (nestjs-throttler)
- [ ] Testes unitários dos casos de erro (senha errada, token expirado, token revogado)

**Critério de aceite**: fluxo completo registro → login → chamada autenticada → refresh → logout testado via e2e (supertest).

---

### 5. CI no GitHub Actions
**Contexto**: garantir que quebra não chega na main.

- [ ] Workflow `ci.yml`: lint, test, build em push/PR
- [ ] Cache de pnpm store e Turborepo remoto/local
- [ ] Rodar apenas nos workspaces afetados (`turbo run lint test build --filter=...[HEAD^]`)

**Critério de aceite**: PR de teste com erro de lint falha o CI; PR limpo passa.

---

### 6. Deploy de staging/produção (Render + Supabase + Cloudflare R2, orçamento zero)
**Contexto**: ter algo publicamente acessível cedo — projeto terá usuários reais desde já, não só validação interna. Ver ADR-0007 (substitui a ADR-0005/Railway: sem free tier perene em 2026).

- [ ] Projeto Supabase (free tier) só para o Postgres — connection string em env, sem usar Auth/Storage do Supabase
- [ ] Web service no Render (free tier) apontando para `apps/api`
- [ ] Bucket Cloudflare R2 (free tier) + credenciais S3-compatible em env
- [ ] Variáveis de ambiente configuradas nos três serviços (não commitadas)
- [ ] Deploy automático a partir da branch `main`
- [ ] Cron leve (GitHub Actions, 1x/dia) batendo em `/health` para evitar pausa do projeto Supabase por inatividade
- [ ] Domínio/URL documentado no README, com nota sobre cold start do Render free (30-60s após inatividade)

**Critério de aceite**: `GET https://<url-render>/health` responde 200 publicamente e consegue ler/escrever no Postgres do Supabase.

---

### 7. Fundação LGPD (consentimento + audit log + export/delete funcionais)
**Contexto**: projeto tem usuários reais desde a Fase 1, então isso não pode ser stub — mais barato modelar direito agora do que retrofitar depois. Ver seção 5 de `product-plan.md`.

- [ ] Entidade `consents` (ver `docs/database-schema.md`)
- [ ] Endpoint `POST /v1/consents` e `GET /v1/consents`
- [ ] Middleware/interceptor que bloqueia ações sensíveis sem consentimento ativo
- [ ] `GET /v1/me/export` **funcional**: gera JSON (ou CSV) com todos os dados do usuário disponíveis até a Fase 1 (perfil, consentimentos) — expandir a cada fase nova que adicionar dados
- [ ] `DELETE /v1/me` **funcional**: marca `account_deletion_requests`, anonimiza/expira dados conforme prazo definido (documentar prazo escolhido na política de privacidade)

**Critério de aceite**: tentar uma ação que exige consentimento sem tê-lo dado retorna 403 com mensagem clara; export e delete funcionam de ponta a ponta para os dados existentes na Fase 1 (não apenas retornam "em processamento").

---

### 8. Logging estruturado e observabilidade
**Contexto**: reaproveitar sua experiência com Pino + BetterStack, com cuidado de não logar dados sensíveis.

- [ ] Pino configurado com redact de campos sensíveis (senha, token, dados de exame)
- [ ] Integração com BetterStack
- [ ] Exception filter global que loga erro com contexto sem vazar stack trace pro cliente em produção

**Critério de aceite**: erro forçado em endpoint de teste aparece no BetterStack com contexto, e a resposta HTTP não expõe stack trace.

---

### 9. Baseline de segurança (hardening desde o início)
**Contexto**: usuários reais desde a Fase 1 — segurança não pode ser tratada como item de fase futura. Ver `CLAUDE.md`.

- [ ] `helmet` habilitado no bootstrap do Nest
- [ ] `nestjs-throttler` global, com limites mais restritivos em `/v1/auth/*` e `/v1/exams` (upload)
- [ ] CORS restrito a origens conhecidas (app mobile via bundle id/scheme, não `*`)
- [ ] `pnpm audit` (ou equivalente) rodando no CI, quebrando build em vulnerabilidade alta/crítica
- [ ] Dependabot (ou Renovate) configurado no repositório
- [ ] Checklist de segurança do `rules/common/security.md` revisado manualmente antes do primeiro deploy público

**Critério de aceite**: requisição sem token a um endpoint protegido retorna 401; excesso de tentativas de login (>5 em 1 min) retorna 429; CI falha se `pnpm audit` encontrar vulnerabilidade alta/crítica.
