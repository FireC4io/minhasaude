# ADR-0007: Hosting com orçamento zero — Render (API) + Supabase (Postgres) + Cloudflare R2 (arquivos)

## Status
Recomendado — substitui a recomendação de hosting da ADR-0005 após confirmação do usuário: orçamento zero por enquanto, decisão de pagar por infra é futura, mas o projeto terá usuários reais desde cedo (não só portfólio isolado).

## Contexto
ADR-0005 recomendava Railway para API+Postgres. Pesquisa atualizada (set/2026) mostra que a **Railway não tem mais tier gratuito perene** — apenas US$5 de crédito único por 30 dias, depois cobrança obrigatória. Isso quebra a premissa de custo zero. Precisamos de uma combinação 100% gratuita hoje, com caminho de upgrade sem reescrever código quando o orçamento abrir.

## Decisão
- **API (NestJS)**: Render, tier free (web service). Fica "adormecida" após 15 min sem tráfego, acorda em 30-60s no próximo request — aceitável para fase inicial com poucos usuários reais; documentar isso como limitação conhecida, não como bug.
- **Postgres**: Supabase free tier (500MB, mais que suficiente para o volume do MVP). Usamos só o Postgres (via connection string padrão + TypeORM) — **não** usamos Supabase Auth (mantemos JWT próprio, já decidido) nem Supabase Storage (usamos R2, mais barato para arquivos de exame).
  - ⚠️ Projetos free do Supabase pausam após 7 dias sem atividade. Mitigar com um cron simples (GitHub Actions, grátis) fazendo `GET /health` 1x/dia.
- **Storage de arquivos de exame**: Cloudflare R2 free tier (10GB, 1M writes/mês, 10M reads/mês, **zero egress**) — mantém-se igual à ADR-0005, só a camada de compute/DB muda.
- **Caminho de upgrade** (quando o orçamento for liberado, decisão futura): trocar Render free → Render paid ($7/mês, sem cold start) ou Railway/Fly.io, e Supabase free → Supabase Pro ou instância dedicada. Como tudo fica atrás de variáveis de ambiente (connection string, bucket credentials), a troca não exige mudança de código.

## Justificativa
- Zero custo real hoje, sem cartão de crédito obrigatório em nenhum dos três serviços.
- Cold start do Render é uma limitação aceitável para "usuários reais" em estágio inicial de um projeto de portfólio — não é um app com SLA comercial. Se isso virar problema real (reclamação de usuário, uso crescendo), é o sinal exato para liberar orçamento e migrar.
- Manter Postgres e Storage em provedores desacoplados do compute evita lock-in e facilita trocar só a peça que doer primeiro.

## Trade-off assumido (documentar para o usuário, não decidir sozinho)
Rodar um app de saúde real com dados sensíveis (exames) em infraestrutura free-tier é aceitável tecnicamente, mas **a responsabilidade de segurança não pode depender do tier pago** — motivo pelo qual a Fase 1 já inclui rate limiting, hardening de headers, auditoria de dependências e LGPD funcional (não stub) desde o início, independente do custo de hosting. Ver `CLAUDE.md` e `docs/backlog-fase1.md`.

## Alternativa descartada: Railway (ADR-0005 original)
Sem tier gratuito perene em 2026 — quebra a restrição de orçamento zero atual. Reavaliar quando o orçamento for liberado; continua sendo uma boa opção paga (melhor DX que Render pago, segundo comparações de mercado).

## Alternativa descartada: Vercel Functions + Neon
Mesma análise da ADR-0005 original: complexidade extra (pooler, cold start de function) não compensa neste estágio, mesmo gratuito.
