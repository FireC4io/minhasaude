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

## Active Context (última sessão: 2026-09-18)
- **Fase 1: essencialmente completa** (issues #1-#9). Issue #8 (observabilidade): logs de produção indo pro BetterStack (source `minhasaude-api`) via `@logtail/pino` (`apps/api/src/config/pino-transport.ts`), redact do pino-http valendo antes de qualquer transport — falta só o exception filter global custom (item pendente de baixo risco, ver `docs/backlog-fase1.md` issue #8; comportamento default do NestJS já não vaza stack trace pro cliente).
- **Fase 2 completa** (issues #10-#15, backlog e detalhes técnicos em `docs/backlog-fase2.md`): catálogo de calculadoras (`packages/shared/src/calculators/` — TMB, TDEE, macros, ajuste por objetivo), `body-measurements`, `goals` (TMB/TDEE/macros de verdade, histórico imutável), catálogo de alimentos + import TACO (582 itens, `pnpm --filter api seed:taco`), busca (trigram/unaccent + fallback Open Food Facts com cache), e `diary` (diário alimentar com snapshot imutável de macros, cópia de dia, resumo vs. meta). Todo módulo novo: consentimento LGPD quando toca dado de saúde, incluído em `GET /v1/me/export`, testado com unitários + e2e.
- **Achado crítico corrigido em produção (2026-09-18)**: `packages/shared` nunca tinha sido compilado de verdade (`build` era um `echo` placeholder desde a Fase 1) — `node dist/main.js` (como produção roda) não resolvia `@minhasaude/shared` em runtime. Corrigido: `tsconfig.build.json` + `main`/`types` apontando pra `dist/`, e o `buildCommand` do serviço no Render atualizado via API pra `pnpm exec turbo run build --filter=@minhasaude/api` (builda o shared antes, via `dependsOn` do `turbo.json`). Validado: deploy manual ficou `live`, `/health` e `/docs` responderam 200.
- **Auto-deploy no push: resolvido e confirmado** (2026-09-18) — GitHub App do Render instalado (antes só havia login OAuth, sem o app de verdade, por isso o webhook nunca disparava). Testado com o push real do commit da issue #15: deploy disparou sozinho, ficou `live`, sem precisar do `POST .../deploys` manual. Fase 2 (issues #10-#15) está publicada em produção de verdade.
- **Gotcha de plataforma**: NestJS 12, `@nestjs/jwt` 12, `@nestjs/typeorm` 12 são ESM-only e quebram Jest — projeto fixado em `11.x`/legacy de cada pacote Nest. Verificar antes de atualizar qualquer `@nestjs/*`.
- **Produção real**: https://minhasaude-api.onrender.com, Postgres no Supabase (`sa-east-1`, session pooler), bucket R2 `minhasaude-exams`.
- **Fase 3 (app mobile) iniciada**: backlog em `docs/backlog-fase3.md`, issues abertas de verdade no GitHub como **#17-#21** (setup, client+auth, onboarding, diário+resumo, peso+gráfico, nessa ordem). Decisões de stack travadas: `orval` para o client OpenAPI (ADR-0003 atualizada) e `NativeWind` para estilização (ADR-0008).
- **Identidade visual "Gota Vital" aprovada (2026-09-18)**: paleta com nome de comida brasileira (Areia/Mamão/Couve/Jabuticaba/Maracujá, hex + variante dark), tipografia em 3 papéis (Fredoka/Work Sans/JetBrains Mono) e símbolo (gota + traço de batimento). Detalhes e hex exatos na memória `project_identidade_visual_gota_vital`; tokens de cor já aplicados em `apps/mobile/src/global.css` + `tailwind.config.js`. Fontes (Fredoka/Work Sans/JetBrains Mono) ainda não carregadas no app — pendente para quando houver telas de UI reais.
- **Issue #17 concluída (2026-09-18)**: `apps/mobile` scaffoldado de verdade (Expo SDK 57 + Expo Router + TypeScript, a partir do template oficial `create-expo-app`, adaptado pro monorepo). NativeWind 4.2.7 configurado (`babel.config.js`, `metro.config.js`, `tailwind.config.js`, `src/global.css`) — validado que uma `className` real compila no bundle (cores da identidade aparecem no CSS gerado pelo `expo export`). `@minhasaude/shared` resolvido pelo Metro e pelo Jest (teste em `src/integration/shared-package.spec.ts`). ESLint via `@minhasaude/config/eslint-preset.cjs` + `eslint-config-expo/flat` (precisou filtrar a config do preset compartilhado pra não colidir o registro do plugin `@typescript-eslint` com o do `eslint-config-expo` — ver `apps/mobile/eslint.config.js`). `eas.json` com profiles development/preview/production criado, mas nenhum build real disparado (precisa de conta Expo — passo manual do dev). `turbo run lint test build` roda limpo nos 4 packages do monorepo.
- **Gotcha de plataforma (mobile)**: o isolamento estrito de node_modules do pnpm quebra resolução de plugins do babel do ecossistema Expo/RN (ex.: `@babel/plugin-transform-react-jsx` não resolvia a partir de `babel-preset-expo`). Corrigido com `nodeLinker: hoisted` (afeta `apps/api`/`packages/shared` também, mas ambos foram revalidados — testes e build seguem passando).
- **pnpm atualizado de 9.15.0 → 12.4.2 (2026-09-18)**, decisão final depois de pesquisar a fundo (ver `pnpm/pnpm#12880`): a 9.15.0 tinha um bug real e determinístico no linker `hoisted` no Windows (race no `fs.hard-link-dir` — um pacote sendo copiado apagava a pasta temporária de um pacote vizinho instalando ao mesmo tempo, causando `ERR_PNPM_ENOENT` intermitente). Corrigido pelo próprio time do pnpm no commit `2f2bdaf` (~27/08/2026) — confirmado via comparação de commits que a **linha 9.x nunca vai receber esse patch** (branch já divergiu 3713 commits, efetivamente abandonada); a correção só existe a partir de `11.27.0`/`12.x`. Atualizado também o **binário global** (`npm install -g pnpm@12.4.2` — o `pnpm` global da máquina tinha prioridade no PATH sobre o corepack).
- **pnpm 12 mudou onde várias configs vivem** (WARN explícito ao instalar): `pnpm-workspace.yaml` agora é a única fonte pra `overrides` (não lê mais `package.json` → `pnpm.overrides`) e pra `nodeLinker` (não lê mais `.npmrc` → `node-linker`). Migrado: `.npmrc` removido, `pnpm-workspace.yaml` agora tem `nodeLinker: hoisted` + `overrides` (incluindo `js-yaml: ">=4.3.2 <5"` — apertado porque `>=4.3.2` sozinho resolve pra v5, que quebra o import ESM do `orval`).
- **pnpm 12 também trouxe duas políticas de supply-chain novas, ambas exigindo ação na primeira instalação**: `minimumReleaseAge` (recusa por padrão pacotes publicados muito recentemente — o próprio pnpm auto-populou `minimumReleaseAgeExclude` no `pnpm-workspace.yaml` pros pacotes do Expo publicados no mesmo dia) e scripts de build/postinstall de dependências passam a vir bloqueados por padrão (`pnpm approve-builds --all` liberou `argon2`, `@parcel/watcher`, `esbuild`, `unrs-resolver`, `@scarf/scarf` — sem isso o `argon2` não compila e a API quebra em runtime). Isso também ficou registrado em `pnpm-workspace.yaml` (`allowBuilds`).
- **Gotcha de sandbox (não é bug de código)**: rodar `turbo run lint test build` com concorrência total às vezes crasha (`ERR_PNPM`-like spawn errors, stack overrun no ESLint) neste ambiente por disputa de recursos — cada task sozinha ou com `--concurrency=1` sempre passa limpo. Se acontecer de novo, reduzir concorrência antes de assumir regressão real.
- **Issue #18 concluída (2026-09-18)**: client HTTP gerado via `orval` (`apps/mobile/orval.config.ts`, roda com `pnpm --filter mobile generate:api`) — gera hooks do TanStack Query pra API inteira (auth, diary, foods, goals, body-measurements, consents), não só auth, em `src/api/generated/` (nunca editado à mão). Mutator customizado em `src/api/http-client.ts`: axios com token guardado via `expo-secure-store` (`src/api/token-storage.ts`), renovação automática num 401 (fila compartilhada entre chamadas concorrentes) e sessão limpa quando o refresh também falha. `AuthProvider`/`useAuth` em `src/features/auth/auth-context.tsx` (login, registro com login encadeado, logout). Guard de rota via `Stack.Protected` no `_layout.tsx` raiz — telas movidas pra grupos `(app)`/`(auth)`. Telas de login/registro com a paleta Gota Vital. Testes: login feliz, credencial inválida, sessão persistida, registro encadeado, logout (`auth-context.spec.tsx`) e renovação automática de token simulada com `axios-mock-adapter` (`http-client.spec.ts`) — 10 testes, todos passando. **Ajuste feito na API** (fora do escopo original da issue, mas necessário pro client vir tipado): controllers de auth ganharam `@ApiOkResponse`/`@ApiCreatedResponse`/`@ApiNoContentResponse` explícitos (não dá pra confiar no plugin `@nestjs/swagger` — ver gotcha abaixo) e um `RegisterResponseDto` novo. `turbo run lint test build` roda limpo nos 4 packages.
- **Gotcha real do plugin `@nestjs/swagger` (NÃO habilitar `"plugins": ["@nestjs/swagger"]` no `nest-cli.json`)**: ele injeta `@ApiResponse` automático nos controllers, e o `require()` que gera pra referenciar o tipo de resposta usa um path absoluto de `src/` (não `dist/`) — quebra em runtime via `nest start --watch` (webpack), reproduzido de forma determinística (não é race). Solução adotada: decorators `@ApiOkResponse`/`@ApiCreatedResponse` explícitos em cada controller, sem o plugin.
- **Próximo passo natural**: issue #19 (onboarding — perfil + primeiro cálculo de meta), depende da #18 que está pronta.

## Referências
- Plano completo: `docs/product-plan.md`
- ADRs: `docs/adr/`
- Roadmap: `docs/roadmap.md`
- Backlog Fase 1: `docs/backlog-fase1.md`
