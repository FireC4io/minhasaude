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

## Fase 4 — Publicação
- Política de privacidade e termos (texto real, não lorem ipsum — LGPD + exigência das lojas).
- Exclusão de conta e exportação de dados funcionando de ponta a ponta no app.
- Contas Apple Developer e Google Play criadas.
- Build de produção (EAS), teste fechado no Google Play (~12 testers, 14 dias — obrigatório para conta nova).
- TestFlight para iOS.
- Submissão e publicação nas duas lojas.
- **Entregável**: app publicado, baixável publicamente (ou em teste fechado, conforme sua resposta à pergunta 7).

## Fase 5 — Exames e métricas de saúde
- Upload de exame (foto/PDF) → storage (R2) → fila (pg-boss) → extração via IA com visão.
- Tela de revisão obrigatória dos valores extraídos.
- Normalização de unidades + catálogo de calculadoras (HOMA-IR, TyG, Castelli I/II, FFMI, CKD-EPI 2021, etc.).
- Histórico de bioimpedância com aviso explícito de não comparabilidade entre aparelhos.
- Consentimento específico para dados de exame.
- **Entregável**: usuário envia exame, revisa, e vê índices calculados com fonte/fórmula visível.

## Fase 6 — Evolução
- Leitor de código de barras (scanner nativo → busca por EAN).
- Gráficos de evolução mais completos (macros ao longo do tempo, exames).
- Registro de treinos.
- Recursos sociais (se fizer sentido para o produto).
