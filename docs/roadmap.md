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

## Fase 4 — Refundação da interface (ampliada em 2026-10-02)
Objetivo: **um app bom e eficiente para todos os públicos** — não só acessível, mas confortável
para pessoa idosa, com baixa visão, com pouca familiaridade com tecnologia, com celular básico e
internet ruim. Backlog completo em `docs/backlog-fase4.md`, organizado em blocos:
- **A. Fundação acessível** ✅ — componentes base com papel/rótulo/estado e alvo de 48 dp (#30, #31).
- **B. Ambiente de validação real** — emulador Android (já funcionando) e fluxos ponta a ponta com Maestro.
- **C. Identidade Gota Vital** — fontes, ícone e splash próprios, barra de abas na paleta, e
  **paleta com contraste aprovado** (a cor de ação reprova hoje no modo claro: 2,45:1).
- **D. Inclusão ampla** — fonte em 200% sem quebra, não depender só de cor, movimento reduzido,
  linguagem simples.
- **E. Formulários e fluxos** — teclado nunca esconde a ação, entradas no formato brasileiro,
  estados vazio/sucesso/erro completos, internet ruim e servidor dormindo tratados na UI.
- **F. Telas que faltam e nova estrutura** — tela "Hoje" nova (calendário, semana, cards, água, peso,
  notas), abas Hoje · Progresso · Exames · Perfil, boas-vindas e onboarding em passos, **recuperar
  senha** (não existe hoje), login com Google, perfil/exportar/excluir (LGPD), "Sobre" com créditos
  TACO/OFF, textos prontos para tradução. Referência: `docs/referencia-mfp.md`.
- **G. Desempenho** — medido em perfil de celular básico.
- **H. Fechamento** — TalkBack de ponta a ponta, VoiceOver se houver iPhone, e teste de
  usabilidade com 3 a 5 pessoas de perfis diferentes.
- Referência: **ABNT NBR 17060:2022** (54 requisitos alinhados ao WCAG, específica para apps
  móveis; dá base ao art. 63 da LBI 13.146/2015).
- **Entregável**: as tarefas principais concluídas sem ajuda por pessoas de perfis diferentes,
  também com TalkBack e fonte em 200%; nenhum par de cor abaixo de 4,5:1; telas de LGPD no app.

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
- ~~Decidir o nome~~ — decidido em 2026-10-02: **Gota Vital**. Falta, antes de investir em marca:
  checagem no INPI e nas lojas, e definir o bundle id.
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
- Registro de treinos, com exercícios ilustrados/animados.
- Passos e exercícios automáticos via Health Connect (Android) e HealthKit (iOS), e smartwatch.
- Receitas com cálculo por ingrediente.
- Registro de refeição por voz com IA (mesmo portão de orçamento dos exames; sempre com revisão antes de salvar).
- Tradução e lançamento em outros países (a base TACO e as regras ANVISA/LGPD são brasileiras).
- Recursos sociais (se fizer sentido para o produto).
