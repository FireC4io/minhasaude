# CLAUDE.md — Gota Vital

App mobile de nutrição e acompanhamento de saúde (inspirado no MyFitnessPal, sem usar esse nome), com diferencial de análise de exames de sangue e bioimpedância. Projeto de portfólio **e** com usuários reais desde a Fase 1 — não é só um exercício isolado, então segurança e LGPD não são "depois". Público brasileiro, app em português. Desenvolvedor solo, sem prazo fixo, orçamento de infra R$0 por enquanto (ver ADR-0007).

## Arquitetura
- Monorepo: pnpm workspaces + Turborepo (`apps/api`, `apps/mobile`, `packages/shared`, `packages/config`).
- Backend: NestJS + TypeORM + PostgreSQL em camadas (controller → service → `Repository` do TypeORM injetado direto; não há interface própria de repositório). Interface própria (porta + adaptador) só onde o fornecedor pode mudar: e-mail (`mail/mailer.ts`) e, na Fase 6, IA de leitura de exames e arquivos no R2.
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
- Seguir `rules/common/coding-style.md`: imutabilidade, arquivos pequenos (200-400 linhas típico, 800 máximo), Repository pattern, validação em toda borda do sistema: `class-validator` nos DTOs de entrada da API (gera o Swagger), Zod no `shared`, nas variáveis de ambiente e em dado que vem de fora (Open Food Facts, resposta de IA).
- Nomes de entidades/variáveis em inglês; textos de UI em português (pt-BR).
- Migrations do TypeORM sempre geradas, nunca `synchronize: true` fora de teste local isolado.
- Testes: TDD para lógica de negócio crítica (cálculo de metas, normalização de exames, calculadoras de índices) — não exigir 80% de cobertura em CRUD trivial, priorizar qualidade sobre número.

## O que este projeto NÃO faz (fora de escopo até indicação contrária)
- Diagnóstico médico ou recomendação de tratamento/dosagem.
- Comparação direta de bioimpedância entre aparelhos diferentes.
- Import em massa do Open Food Facts (busca é sob demanda — ver ADR-0004).
- Funcionalidades sociais, gráficos avançados, leitor de código de barras, registro de treinos — reservado para a Fase 8, Evolução (`docs/roadmap.md`).

## Onde está o contexto (ler no início da sessão)
- **Estado e próximos passos da fase atual: `docs/plano-proxima-sessao.md`** — ler primeiro. Inclui pendências do dono.
- Fases (decisão de 2026-10-10): **5 = Segurança e teste fechado (atual)**, 6 = Exames, 7 = Lançamento + plano pago, 8 = Evolução. Detalhe em `docs/roadmap.md`.
- Plano visual: https://claude.ai/artifact/M3cugePLkCpbjSkbVJq3BB · Relatório de telas: https://claude.ai/artifact/7GPKyqDzTUBprpubZx5zXq — **ler a coleção `adicoes` do db desse artifact (`ArtifactData list`) antes de replanejar telas**: é onde o dono deixa ideias.
- Histórico (sessões, incidentes, decisões antigas, por que as coisas são como são): `docs/historico/` — consultar sob demanda, não carregar inteiro.
- Segurança: `docs/security/avaliacao-2026-10.md` (achados), `docs/security/backup.md` (backup cifrado; chave privada age só com o dono em `D:\gotavital-backup-chave`). Política de privacidade: `docs/legal/politica-de-privacidade.md`.
- Mapa de dependências entre módulos: `docs/arquitetura/dependencias.md` (gerado por `pnpm deps:graph`). Versão visual para o dono: https://claude.ai/artifact/VPAifv2Ax3yJVF4JrfBnrN (gerador em `docs/arquitetura/mapa/`; refazer quando surgir pasta/módulo novo).
- Ferramentas de contexto: busca direta no código, **Serena** (MCP; símbolos, referências, renomear) e **Melchizedek** (`m9k_search`/`m9k_errors`/`m9k_file_history`: sessões passadas — usar antes de reinvestigar problema já visto). O grafo do graphify e o vault do Obsidian foram aposentados em 2026-10-11: não regenerar.

## Decisões do dono que valem para tudo
- Nome do app **Gota Vital**; identificador `br.com.gotavital`. Identificadores internos seguem `minhasaude` de propósito (escopo `@minhasaude/*`, repo, serviço `minhasaude-api` no Render, buckets, banco) — não renomear infra.
- Modelo **sem anúncios**: uso diário livre; leitura de exame por IA no plano pago (R$ 9,90/mês ou R$ 59,90/ano — ainda não registrado no roadmap como final). Teste fechado na Play antes dos exames.
- Público amplo (idoso, baixa visão, pouca familiaridade com tecnologia, celular básico, internet ruim): acessibilidade é requisito (referência ABNT NBR 17060:2022). Idade mínima 18 (`isAdult` no shared).
- App em **pt-BR, inglês e espanhol** (interface; nomes da TACO seguem em português).
- Exclusão de conta é **imediata e permanente** (`DELETE /v1/me` → `{ status: 'deleted' | 'pending_retry' }`), com aviso e oferta do relatório de progresso antes. Export LGPD ainda não inclui alimentos cadastrados pela pessoa (dono vai discutir).
- E-mail transacional via **Brevo** (remetente Gmail). MyFitnessPal é referência de **funcionamento**, nunca de visual ou texto (`docs/referencia-mfp.md`).
- Contas do dono: Google Play, Expo (`@caio_cesar_dev/gota-vital`), Google Cloud (projeto `gotavital`), Brevo, R2. Fechar issues no GitHub e fazer push com deploy fica com o dono quando o modo automático bloquear.
- **Exames pessoais do dono em `docs/` (pdf/jpeg): nunca commitar, nunca trabalhar neles sem pedido.** O repo é público; `.gitignore` bloqueia pdf/imagens em `docs/`.

## Regras de código vigentes

### API (NestJS)
- App montado por `configureApp`; testes de segurança usam `test/support/security-app.ts`. Suíte que faz muitos pedidos sobre outra coisa usa `withoutRateLimit` (`test/support/without-rate-limit.ts`); os testes do próprio limite, nunca.
- Todo texto de entrada tem teto em `INPUT_LIMITS` (shared). Criar/alterar/calcular dado de saúde exige `@RequireConsent`; ler/exportar/apagar não. Guard JWT confere conta ativa; HS256 fixo.
- **Resposta sempre por DTO**: `@Expose()` em cada campo, `@Type(() => Dto)` em aninhado, e o controller devolve `toDto(...)`/`toDtoList(...)` (`common/serialization/to-dto.ts`). Campo não declarado não sai. Exceção consciente: `GET /v1/me/export` (portabilidade LGPD; só o hash de senha fica fora). Regressão em `test/response-leak.e2e-spec.ts`.
- Swagger: `@ApiOkResponse`/`@ApiCreatedResponse`/`@ApiNoContentResponse` explícitos; **nunca** ligar o plugin `@nestjs/swagger` no `nest-cli.json` (quebra em runtime com path de `src/`). Campo nullable primitivo: `{ type: String, nullable: true }` explícito, senão o orval gera tipo inútil.
- TypeORM: `relations` em forma de objeto (`{ food: true }`). Coluna `numeric` volta `string`.
- **Migrations rodam no boot** (`migrationsRun: true`) e a TACO é a migration `SeedTacoFoods`. Por isso: parar o `start:dev` antes de gerar/editar migration (matar o pai `nest start --watch`, senão ele religa; PowerShell: `Get-CimInstance Win32_Process -Filter "Name='node.exe'"`); **sempre revisar o que o `migration:generate` gera** (ele tenta apagar índices feitos à mão — declarados com `synchronize: false` em `Food`); timestamp de migration manual não pode ficar à frente do relógio. **Tabela nova entra na lista de RLS** (`EnableRowLevelSecurity`).
- Busca de alimento (`foods/search/`): SQL cru devolve ids em ordem + `findBy` para hidratar; forma padrão nova vai em `PREFERRED_FOODS`.
- Versões travadas: `@nestjs/*` em 11.x e `@nestjs/schedule` em 5.x (as mais novas são ESM-only e quebram o Jest). Conferir antes de atualizar. O Dependabot só propõe correções e versões menores (`.github/dependabot.yml`); versão principal é migração planejada.
- `reflect-metadata` é `setupFiles` do Jest da API.

### App (Expo)
- **Nenhum texto solto no JSX**: tudo em `src/i18n/locales/pt-BR.ts` (fonte) + `en.ts` + `es.ts`. `useTranslation()` em componente, `i18n.t()` fora; rótulos fixos com `translatedLabels` (`i18n/labels.ts`); número/data com `formatNumber`/`formatDate`/`appLocale()`; plural `_one`/`_other` + `count`. Linguagem simples: "anotar", "apagar", sem siglas soltas. Testes rodam em pt-BR.
- Client HTTP gerado pelo orval (`pnpm --filter mobile generate:api`); `src/api/generated/` nunca é editado à mão.
- `PREVIEW_FEATURES` (`src/config/features.ts`): telas sem API usam dados de demonstração com `PreviewBanner`/`PreviewTag`, só em `__DEV__`, nunca em produção. Exames passam por `features/exams/exam-repository.ts`.
- Componentes: `AppText` (nunca `font-semibold` com fonte custom), `ListRow`, `RadioList`, `CheckboxRow`, `FormScreen`, `ModalHeader`, `UndoBar`, `FloatingAddButton`, `PrimaryButton tone="danger"`, `TextButton` (ação em texto, nunca `Pressable` solto), `FormError`, `LoadingIndicator`. Tokens: `bg-superficie` (**nunca `bg-white`**), `linha` para borda (`grafite/20` não funciona), `mamao-forte`, `maracuja-forte`, `grafite-suave`.
- Acessibilidade: números falados com `spokenKcal`/`spokenGrams`/`spokenKg`/`spokenDate`; anúncio com `useAnnounce` no iOS e `accessibilityLiveRegion` no Android (os dois juntos fazem o TalkBack falar duas vezes); nunca botão dentro de `Pressable` acessível; em `Pressable` com `className`, `style` é sempre objeto e o pressionado vai por `active:opacity-*`. Entrada decimal com `parseDecimal` (aceita vírgula).
- Valor seminegrito (`bodyStrong`) alinhado à direita numa linha: dar largura ao texto (`flex-1 text-right`), senão o Android corta a última palavra.
- `Link` do expo-router ignora `className` (usar `TextButton` + `router.push`); rota dinâmica tipada: `{ pathname: '/exam/[id]', params }`. Data do diário com `date-utils`, nunca `toISOString()` (UTC).
- Guard raiz: `resolveRootRoute()` — só 404 da meta leva ao onboarding; outro erro cai em `GoalUnavailableView`.
- Gráficos: `react-native-svg` + componente próprio (não gifted-charts); largura inicial de `useWindowDimensions`, `onLayout` só refina.
- Cache do React Query fica no aparelho por 24 h e é apagado no logout (`clearPersistedCache`). `app.json` com `allowBackup:false` e permissões bloqueadas (teste em `src/config/app-config.spec.ts`).
- Testes de tela: **`await render(...)`** (RTL 14 é assíncrono) e `await userEvent.press`; `SafeAreaProvider` com `initialMetrics`; `jest.clearAllMocks()` no `beforeEach` (mock de `announceForAccessibility` acumula).

### Shared
- Calculadoras (`src/calculators/`, inclusive `exam-indices.ts`) gravam `calculator_version`. Enums/schemas Zod de domínio aqui; limites de validação espelham a API.

## Ambiente e armadilhas vigentes
- **pnpm 12.4.2** (global e `packageManager`). Config só em `pnpm-workspace.yaml` (`nodeLinker: hoisted` — obrigatório pro Expo —, `overrides`, `allowBuilds`, `minimumReleaseAgeExclude`). Pacote publicado há pouco é recusado (`minimumReleaseAge`); script de build de dependência nova precisa entrar em `allowBuilds`.
- `turbo run lint test build` às vezes crasha por disputa de recursos: rodar com `--concurrency=1` antes de suspeitar de regressão.
- Lint com `--max-warnings 0` nos três pacotes. Hook `.githooks/pre-commit` (ligado pelo `prepare` no `pnpm install`) roda lint e tipos do que está no commit. Pacotes do Expo sobem com `npx expo install --fix`, nunca soltos; `@react-native/metro-config` fixado em `overrides` junto do React Native. `turbo.json` com `agentGuidance: false` (senão o turbo cria um `AGENTS.md`).
- **Stack local**: `docker compose up -d postgres` → `pnpm --filter api start:dev` (aplica migrations) → `cd apps/mobile && npx expo start --web --port 8081`. Validar web **só contra a API local** (CORS de produção bloqueia `:8081` e o erro parece de rede). Token fica no `localStorage` de `:8081` e sobrevive à troca de API.
- Contas de teste locais: `e2e-1790272811@local.test`, `sweep-ui-01@local.test`, `relatorio-01@local.test`, senha `SenhaTeste123!`.
- **Emulador Android**: AVD `Medium_Phone_API_37.0` em `D:\Android\avd` (`ANDROID_AVD_HOME=D:\Android\avd`; o C: não tem espaço), subir com `-memory 4096 -gpu swiftshader_indirect`; depois `adb reverse tcp:3000 tcp:3000` e `tcp:8081`. Git Bash: `MSYS_NO_PATHCONV=1` para `adb shell` com `/sdcard`; `uiautomator dump` sai em UTF-8; ESC volta à home do Expo Go (fechar teclado com `keyevent 4` só se `mInputShown=true`). No Expo Go: desligar "Tools button"; "isn't responding" na primeira carga → "Wait".
- Metro: **nunca subir com `CI=1`** (não acompanha arquivos); arquivo novo não visto → `npx expo start --clear`. Tarefas em background morrem em 30 min: usar `timeout` longo.
- `curl` no Git Bash manda acento na página de código errada (busca volta vazia) — testar com Node/supertest. HTML sem navegador: `msedge --headless=new --screenshot`. Extensão do Chrome sem resposta: `list_connected_browsers` diagnostica melhor.
- Produção: https://minhasaude-api.onrender.com (Render, deploy automático no push), Postgres no Supabase `sa-east-1` (plano gratuito pausa por inatividade). `keep-alive.yml` consulta `/health` a cada 10 min: mantém Render e Supabase acordados e é o alerta de queda (falha → e-mail do GitHub), R2. Acesso de Claude: memória `reference_render_supabase_access`.
- Regras de arquitetura em `.dependency-cruiser.cjs` (sem ciclos, shared não importa app, API e mobile sem import direto) rodam no CI: `pnpm deps:check`.

## Referências
- Plano completo: `docs/product-plan.md` · Roadmap: `docs/roadmap.md` · ADRs: `docs/adr/`
- Backlogs: `docs/historico/backlog-fase1.md` a `docs/historico/backlog-fase4.md`
- Banco: `docs/database-schema.md` · Contrato de API: `docs/api-contract.md`
- Histórico: `docs/historico/`
