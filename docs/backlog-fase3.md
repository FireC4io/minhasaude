# Backlog — Fase 3: App mobile (formato de issues do GitHub)

> Copiar cada bloco como uma issue no GitHub (`gh issue create`), como foi feito nas Fases 1 e 2. Ver `docs/roadmap.md` para o entregável da fase, `docs/api-contract.md` para os endpoints já prontos no backend (Fases 1-2, todos em produção) e `docs/adr/0003-tipos-compartilhados-rest-openapi.md` + `docs/adr/0008-estilizacao-mobile-nativewind.md` para as decisões de stack confirmadas nesta fase.

**Decisões de stack confirmadas nesta fase**: `orval` (gera client OpenAPI + hooks TanStack Query em um passo) e `NativeWind` (Tailwind para RN/Expo). Ver ADRs acima.

**Ordem de dependência entre issues**: 16 → 17 → 18 → 19; 20 depende de 17 e pode rodar em paralelo com 18/19.

---

### 16. Setup do app mobile (Expo + Expo Router + EAS + NativeWind)
**Contexto**: scaffold real do `apps/mobile` (hoje é só placeholder — ver `apps/mobile/package.json`). Antes de escrever qualquer tela, seguir o passo de pesquisa do workflow do projeto: buscar um template Expo Router + monorepo pnpm já testado (`gh search repos`/`gh search code`) para partir de uma base validada em vez de montar o Metro config + monorepo integration do zero.

- [ ] `pnpm create expo-app` dentro de `apps/mobile` (ou adaptar de um template de referência encontrado na pesquisa), TypeScript, Expo Router habilitado
- [ ] Integração com o monorepo: `apps/mobile` consome `packages/config` (`tsconfig.base.json`, `eslint-preset.cjs`, `.prettierrc.json`) do mesmo jeito que `apps/api` — nada de config duplicada
- [ ] `apps/mobile` consegue importar `@minhasaude/shared` (enums, calculadoras, schemas Zod) — validar que o Metro bundler resolve pacotes do workspace corretamente (ponto que já causou um bug real no backend com `packages/shared`, ver `docs/backlog-fase2.md` issue #14 — testar de verdade, não assumir)
- [ ] NativeWind configurado (tailwind.config, babel/metro plugin) — uma tela de exemplo prova que uma className aplica estilo real
- [ ] EAS Build configurado (`eas.json` com profile `development` no mínimo) — build de desenvolvimento instalável em device real via Expo Go ou dev build
- [ ] `turbo.json` atualizado: `apps/mobile` participa dos pipelines `lint`/`test`/`build` do monorepo (troca os placeholders de `echo` do `package.json` atual por comandos reais)
- [ ] README do mobile atualizado com passo a passo de setup local (substituindo o texto de placeholder)

**Critério de aceite**: `pnpm --filter mobile start` sobe o Metro bundler, app abre no Expo Go num device real, uma tela com uma className do NativeWind renderiza estilizada, e `turbo run lint test build` roda o pipeline do mobile sem placeholder.

---

### 17. Client HTTP gerado (orval) + autenticação
**Contexto**: primeira coisa que qualquer tela do app precisa — sem isso, nenhuma outra issue desta fase é testável de ponta a ponta. Depende do setup da issue #16. Endpoints já prontos: `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/refresh`, `POST /v1/auth/logout` (ver `docs/api-contract.md`).

- [ ] `orval` configurado para gerar client + hooks TanStack Query a partir do OpenAPI spec da API (`/docs-json` em dev, URL configurável por env pra apontar pra produção)
- [ ] Script `pnpm --filter mobile generate:api` documentado (regenerar o client quando o contrato mudar) — decidir e documentar se roda manual ou vira parte do CI
- [ ] Armazenamento seguro do refresh token (`expo-secure-store`, nunca `AsyncStorage` puro pra token — dado sensível de autenticação)
- [ ] Interceptor/wrapper do client: refresh automático do access token expirado (usa `POST /v1/auth/refresh`) antes de forçar logout
- [ ] Tela de login + tela de registro (Expo Router), com validação via schema Zod compartilhado quando fizer sentido
- [ ] Guarda de rota: usuário não autenticado não acessa telas internas (redirect pro login); usuário autenticado sem perfil completo é direcionado pro onboarding (issue #18) em vez do app principal
- [ ] Logout limpa o token do secure storage e o cache do TanStack Query
- [ ] Testes: pelo menos o fluxo de login feliz e o de credencial inválida, mais o refresh automático simulado (mock do client gerado)

**Critério de aceite**: login com usuário real (contra a API em produção ou local) mantém sessão entre reaberturas do app; token expirado é renovado sem derrubar o usuário pra tela de login; logout realmente invalida a sessão local.

---

### 18. Onboarding (perfil + primeiro cálculo de meta)
**Contexto**: primeira experiência de um usuário novo depois do registro. Depende da issue #17 (client + auth). Endpoints já prontos: `PATCH /v1/me/profile`, `POST /v1/consents`, `POST /v1/goals/recalculate`, `GET /v1/goals/current` (ver `docs/api-contract.md`). **Atenção LGPD**: `PATCH /v1/me/profile` e `POST /v1/body-measurements` exigem consentimento ativo — o onboarding precisa coletar o aceite via `POST /v1/consents` antes de tentar essas chamadas, e mostrar a tela de forma clara (não um checkbox pré-marcado).

- [ ] Tela(s) de consentimento LGPD (política de privacidade) — aceite explícito antes de qualquer dado de saúde ser enviado
- [ ] Formulário de perfil (peso, altura, idade, sexo, nível de atividade, objetivo) com validação via schema Zod compartilhado — reaproveita os enums de `packages/shared`
- [ ] Registro do peso atual como primeira `body_measurement` (`source: 'manual'`)
- [ ] Chamada de `POST /v1/goals/recalculate` ao final do onboarding e exibição do resultado (TMB/TDEE/macros) antes de entrar no app principal — texto informativo, nunca prescritivo (RDC 657/2022, ver `CLAUDE.md`)
- [ ] Onboarding não é repetível incondicionalmente: se o usuário já tem meta ativa (`GET /v1/goals/current` não retorna 404), pula direto pro app principal
- [ ] Testes: fluxo completo mockado (preencher perfil → aceitar consentimento → ver meta calculada)

**Critério de aceite**: usuário novo, do registro até a tela de resumo, sai do onboarding com uma meta calculada de verdade (não mockada) e visível; fechar e reabrir o app não repete o onboarding.

---

### 19. Diário alimentar + resumo diário
**Contexto**: núcleo de uso diário do app — depende da issue #17. Endpoints já prontos: `GET /v1/foods/search`, `POST /v1/diary`, `GET /v1/diary?date=`, `PATCH /v1/diary/:id`, `DELETE /v1/diary/:id`, `POST /v1/diary/copy` (ver `docs/api-contract.md`). O resumo (`consumed`/`target`/`remaining`) já vem pronto na resposta de `GET /v1/diary` — não recalcular no client.

- [ ] Busca de alimento (TACO + Open Food Facts via `/v1/foods/search`) com estado de loading/vazio tratado explicitamente
- [ ] Registro de entrada no diário (quantidade, unidade, porção quando disponível, tipo de refeição)
- [ ] Edição e remoção de entrada existente
- [ ] Tela do dia: entradas agrupadas por refeição + card de resumo (consumido vs meta) — tratar `target`/`remaining` nulos (usuário sem meta calculada ainda) sem quebrar a tela
- [ ] Navegação entre dias (anterior/próximo/data específica)
- [ ] Cópia de dia (`POST /v1/diary/copy`) com confirmação explícita antes de duplicar
- [ ] Testes: registrar, editar, remover, navegar entre dias, copiar dia (mockando o client gerado)

**Critério de aceite**: usuário busca um alimento real (ex. da TACO), registra no diário, vê o resumo do dia refletir o consumo, edita a quantidade e o resumo atualiza; copiar um dia com entradas gera as mesmas entradas no dia de destino.

---

### 20. Registro de peso + gráfico de evolução
**Contexto**: "exceção de baixo custo, alto valor demonstrativo" apontada em `docs/product-plan.md` — único gráfico do MVP (o resto fica pra Fase 6). Depende da issue #17. Endpoints já prontos: `POST /v1/body-measurements`, `GET /v1/body-measurements?source=&from=&to=` (ver `docs/api-contract.md`). **Atenção**: `body_measurements.source` nunca é normalizado entre aparelhos (regra do `CLAUDE.md`) — o MVP mobile só registra `source: 'manual'`; não construir nenhuma comparação implícita entre fontes.

- [ ] Tela de registro rápido de peso (reaproveita o mesmo formulário/validação do onboarding quando possível)
- [ ] Listagem do histórico de peso (`GET /v1/body-measurements?source=manual`)
- [ ] Gráfico de linha simples (peso × tempo) a partir do histórico — biblioteca de gráfico leve compatível com Expo (avaliar `react-native-gifted-charts` ou equivalente na hora de implementar; decisão de baixo risco, não travou o planejamento)
- [ ] Estado vazio tratado (usuário com uma medição só, ou nenhuma) — gráfico não quebra com 0 ou 1 ponto
- [ ] Testes: registrar peso e ver o ponto novo aparecer no histórico/gráfico (mockando o client gerado)

**Critério de aceite**: usuário registra 3+ pesos em datas diferentes e vê uma linha de evolução real no gráfico, sem nenhuma comparação entre `source`s diferentes em nenhum lugar da tela.

---

## Fora de escopo desta fase (confirmado em `docs/roadmap.md`)
- Publicação nas lojas (Apple/Google) — Fase 4.
- Exames/bioimpedância no app — Fase 5.
- Leitor de código de barras, gráficos avançados além do de peso, registro de treinos, recursos sociais — Fase 6.
