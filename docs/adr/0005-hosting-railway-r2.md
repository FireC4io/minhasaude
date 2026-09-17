# ADR-0005: Hosting — Railway (API + Postgres) e Cloudflare R2 (arquivos)

## Status
**Superseded por [ADR-0007](0007-hosting-orcamento-zero-render-supabase-r2.md).** Usuário confirmou orçamento zero por enquanto (decisão de pagar é futura) — Railway não tem mais tier gratuito perene em 2026, então a recomendação de compute/DB mudou para Render + Supabase. A parte de storage (Cloudflare R2) permanece válida e é reaproveitada na ADR-0007. Mantido aqui por histórico de decisão.

## Contexto
NestJS com TypeORM mantém pool de conexões persistente com Postgres — isso combina melhor com compute de processo longo do que com functions serverless (cold start + limite de conexões simultâneas exigiria PgBouncer/driver serverless extra). Também precisamos de storage de arquivos (fotos/PDFs de exame) com URLs assinadas temporárias.

## Decisão
- **Backend + Postgres**: Railway (container persistente + Postgres gerenciado no mesmo projeto). Free/hobby tier baixo custo previsível (~US$5/mês de uso), deploy via GitHub integration, logs e env vars simples.
- **Storage de arquivos de exame**: Cloudflare R2 (S3-compatible), com URLs assinadas (presigned) de curta duração para upload e leitura. R2 não cobra egress, o que importa se o app crescer.
- **Observabilidade**: mantém sua stack já validada — Pino (log estruturado) + BetterStack (agregação/alerta).

## Justificativa
- Solo dev, sensível a custo e a tempo de configuração: Railway minimiza DevOps (sem gerenciar VM, sem configurar rede/VPC manualmente).
- Evita a armadilha de rodar Nest+TypeORM em serverless (Vercel Functions) sem um pooler dedicado (Neon/Supabase pooler ou PgBouncer) — complexidade desnecessária para o estágio atual.
- R2 compatível com o SDK S3 (`@aws-sdk/client-s3`) — não precisa de biblioteca proprietária, fácil trocar de provedor depois se necessário.

## Alternativa descartada: Vercel Functions + Neon
Combinação viável e moderna (Neon é Postgres serverless com pooler nativo), mas adiciona uma camada de complexidade (driver HTTP do Neon vs TypeORM padrão, cold starts de function) sem benefício claro no volume atual. Reavaliar se decidir usar Next.js para uma versão web do produto e quiser unificar tudo na Vercel.

## Alternativa descartada: AWS (EC2/RDS/S3) direto
Controle total, mas exige mais configuração manual (VPC, security groups, IAM) para um ganho que não se justifica no MVP. Custo inicial também tende a ser menos previsível que Railway. Reavaliar se o produto escalar a ponto de precisar de controle fino de infraestrutura.
