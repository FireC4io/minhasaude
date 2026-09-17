# ADR-0006: Extração de exames processada de forma assíncrona (fila com pg-boss)

## Status
Recomendado (aguardando confirmação)

## Contexto
Chamar um modelo de IA com visão para extrair dados de um exame leva de alguns segundos a ~20s+, e pode falhar/re-tentar. Fazer isso de forma síncrona dentro de uma requisição HTTP do app mobile é ruim para UX (usuário travado numa tela de loading) e arriscado (timeout de gateway/proxy).

## Decisão
Processamento **assíncrono via fila**:
1. App envia arquivo → backend grava em R2 e cria registro `exam_document` com status `pending`.
2. Backend enfileira um job de extração.
3. Worker (pode rodar no mesmo processo Nest via `@nestjs/schedule`/consumer dedicado) chama a API de visão, grava resultado bruto, atualiza status para `extracted` ou `failed`.
4. App faz polling leve (ou recebe push notification) do status; quando `extracted`, abre tela de revisão obrigatória.

Fila: **pg-boss** (fila baseada em PostgreSQL, sem infraestrutura nova) para o MVP da Fase 5.

## Justificativa
- Evita acoplar a latência não-determinística de uma API de IA externa ao ciclo de vida de uma requisição HTTP.
- pg-boss reaproveita o Postgres que já vamos ter (ADR-0005), evitando introduzir Redis só para isso — mantém a stack enxuta e barata.
- Modelo de fila também dá lugar natural para retry automático em caso de falha temporária da API de IA, e para rate limiting de custo (processar no máximo N exames/hora).

## Alternativa descartada: processamento síncrono
Mais simples de implementar, mas UX ruim (usuário esperando 10-20s travado), risco de timeout HTTP, e sem retry automático em caso de falha transitória da API de IA. Descartado.

## Alternativa descartada: BullMQ + Redis
Mais robusto e com melhor tooling de observabilidade de filas (Bull Board), mas exige provisionar e pagar por uma instância Redis adicional. Reavaliar como upgrade se o volume de exames processados crescer a ponto de pg-boss (que faz polling no Postgres) virar gargalo.
