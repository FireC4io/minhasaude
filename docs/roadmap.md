# Roadmap em Fases

Prazos omitidos de propósito — dependem da sua resposta sobre dedicação (pergunta 2 em `product-plan.md`). Ordem e dependências são o que importa aqui.

## Fase 1 — Fundação
- Monorepo (pnpm + turborepo), lint/format/tsconfig compartilhados.
- NestJS skeleton: config validado por env, ValidationPipe global, Swagger, CORS, Pino.
- Postgres + TypeORM + migrations, rodando local via Docker Compose.
- Auth completo (registro, login, refresh, logout) com hash forte (argon2) e JWT.
- CI (GitHub Actions): lint + test + build em cada PR.
- Deploy do backend em ambiente de staging/produção com orçamento zero (Render + Supabase + Cloudflare R2 — ver ADR-0007).
- Fundação LGPD: entidade de consentimento + audit log, endpoint de export/delete (mesmo que stub).
- **Entregável**: API no ar, com auth funcionando, Swagger publicado, CI verde.

## Fase 2 — Núcleo nutricional
- Import TACO (seed).
- Busca de alimentos (trigram) + integração sob demanda com Open Food Facts.
- Cálculo de metas (Mifflin-St Jeor + Katch-McArdle quando houver % gordura) com ajuste manual.
- Diário alimentar completo (CRUD, cópia entre dias, resumo diário).
- Testes: cobertura forte em cálculo de metas e normalização de porções (é o "motor" do produto).
- **Entregável**: API cobre 100% do fluxo nutricional do MVP, testável via Swagger/Postman.

## Fase 3 — App mobile
- Setup Expo + Expo Router + EAS Build, client gerado a partir do OpenAPI.
- Onboarding (perfil, cálculo de meta inicial).
- Diário alimentar (busca, registro, edição, cópia de dia).
- Resumo diário (calorias/macros vs meta).
- Gráfico simples de evolução de peso (exceção de baixo custo — ver análise crítica).
- **Entregável**: app rodando em device real (Expo Go / build de dev), fluxo completo onboarding → diário → resumo.

> **Reordenação decidida em 2026-09-25**: a publicação saiu da frente e passou a ser a última fase
> antes da evolução. Motivo: o diferencial do produto (exames + bioimpedância) estava *depois* da
> publicação, o que significaria publicar — e pedir a 12 testers 14 dias de uso — de um diário
> alimentar comum, sem o que faz alguém trocar o app que já usa. A publicação também custa US$ 124
> que o orçamento R$ 0 não cobre hoje, então deixá-la por último transforma um bloqueio em uma
> espera que não atrapalha. Entrou uma fase nova de interface **antes** dos exames, porque exames
> são a maior superfície de UI do projeto e construí-los sobre a base atual significaria refazer
> acessibilidade duas vezes.

## Fase 4 — Refundação da interface
- Acessibilidade em todo elemento tocável: `accessibilityLabel`, `accessibilityRole`,
  `accessibilityState` (auditoria de 2026-09-25: **39 elementos tocáveis, 0 com rótulo**).
- Alvos de toque de no mínimo 48 dp (hoje: chips ~36 dp, botões ~44 dp).
- Respeitar a escala de fonte do sistema, sem desligá-la; `maxFontSizeMultiplier` só onde o layout
  quebra, nunca abaixo de 1.2.
- Trocar `Dimensions.get` por `useWindowDimensions` (o primeiro é estático, não reage a rotação).
- Componentes base acessíveis por construção, pra que as telas de exame nasçam prontas.
- Telas que faltam: perfil, exportar dados, excluir conta (a API já faz as três).
- Fontes e set de ícones da identidade Gota Vital.
- Referência: **ABNT NBR 17060:2022** (54 requisitos alinhados ao WCAG, específica para apps
  móveis; dá base ao art. 63 da LBI 13.146/2015).
- **Entregável**: app navegável por leitor de tela (TalkBack e VoiceOver), com escala de fonte
  grande sem quebra de layout, e as telas de LGPD acessíveis pelo próprio app.

## Fase 5 — Exames e métricas de saúde
- Upload de exame (foto/PDF) → storage (R2) → fila (pg-boss) → extração via IA com visão.
- Tela de revisão obrigatória dos valores extraídos.
- Normalização de unidades + catálogo de calculadoras (HOMA-IR, TyG, Castelli I/II, FFMI, CKD-EPI 2021, etc.).
- Histórico de bioimpedância com aviso explícito de não comparabilidade entre aparelhos.
- Consentimento específico para dados de exame.
- **Portão de orçamento próprio**: a extração por IA cobra por chamada. O limite de 1 upload por
  tipo a cada 30 dias reduz o custo, não o zera. Decidir antes de começar: nível gratuito enquanto
  durar, ou tratar como o segundo portão de orçamento do projeto.
- **Entregável**: usuário envia exame, revisa, e vê índices calculados com fonte/fórmula visível.

## Fase 6 — Publicação
- Decidir o nome antes de investir em marca: a seção 1 do `product-plan.md` confirma "Minha Saúde",
  a seção 4 do mesmo arquivo recomenda `NutriTrilha` ou `Mapa Vital` e alerta que o nome atual é
  genérico demais. Contradição em aberto.
- Política de privacidade e termos (texto real, não lorem ipsum — LGPD + exigência das lojas),
  incluindo o prazo de 30 dias da exclusão de conta e o tratamento de dado de exame.
- Contas Apple Developer (US$ 99/ano) e Google Play (US$ 25 único) criadas.
- Build de produção (EAS), teste fechado no Google Play (~12 testers, 14 dias — obrigatório para
  conta nova; os 14 dias só começam a contar quando já houver conta, build e gente instalando).
- TestFlight para iOS.
- Submissão e publicação nas duas lojas.
- **Entregável**: app publicado, baixável publicamente (ou em teste fechado, conforme sua resposta à pergunta 7).

## Fase 7 — Evolução
- Leitor de código de barras (scanner nativo → busca por EAN).
- Gráficos de evolução mais completos (macros ao longo do tempo, exames).
- Registro de treinos.
- Recursos sociais (se fizer sentido para o produto).
