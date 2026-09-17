# ADR-0002: TypeORM (mantendo a stack conhecida) em vez de Prisma/Drizzle

## Status
Recomendado (aguardando confirmação)

## Contexto
Você já tem experiência prática com NestJS + TypeORM + PostgreSQL. Prisma e Drizzle são alternativas modernas com trade-offs diferentes.

## Decisão
Manter **TypeORM**, mas isolado atrás do **padrão Repository** (interfaces de domínio + implementação concreta com TypeORM), conforme já é convenção nas suas regras de projeto.

## Justificativa
- Familiaridade reduz risco de cronograma em um projeto solo com prazo — você já sabe depurar migrations, relations e o QueryBuilder do TypeORM.
- O domínio tem bastante uso de `jsonb` (dados extraídos de exames, inputs de calculadoras) e relations complexas (exame → documento → marcadores → resultados) — TypeORM lida bem com isso via `@Column('jsonb')` e relations padrão.
- Encapsular atrás de Repository já mitiga o maior risco de "prender" a arquitetura ao ORM: se um dia quiser migrar para Drizzle, a troca fica isolada na camada de infraestrutura.

## Alternativa descartada: Prisma
Melhor DX de schema e migrations, mas: motor de query é um binário separado (aumenta cold start/tamanho de imagem em deploy), histórico de suporte mais fraco a relations complexas e queries muito customizadas, e trocar de ORM agora custaria tempo de aprendizado que não se traduz em valor de produto no MVP. Reavaliar em projeto novo sem legado de conhecimento.

## Alternativa descartada: Drizzle
Mais leve, type-safe "de verdade" (tipos inferidos do schema, sem geração de client), SQL-like — tecnicamente atraente e vale estudar depois. Mas é uma ferramenta nova para você agora, e o ganho (performance de query, bundle menor) não é o gargalo deste projeto. Se quiser demonstrar essa competência em portfólio, sugiro um projeto satélite pequeno dedicado a isso, não o MVP crítico.
