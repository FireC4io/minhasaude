# ADR-0003: Tipos compartilhados via REST + OpenAPI codegen (não tRPC)

## Status
Recomendado (aguardando confirmação)

## Contexto
App e API precisam compartilhar tipos e validações (DTOs de perfil, diário, exames) sem duplicar definição manualmente.

## Decisão
- Backend expõe **OpenAPI/Swagger** (já é prática sua) como fonte da verdade do contrato HTTP.
- Gerar um **client TypeScript tipado para o mobile** a partir do OpenAPI spec (ex.: `orval` ou `openapi-typescript` + `openapi-fetch`) em tempo de build/CI.
- `packages/shared` guarda o que não é gerado automaticamente: enums de domínio (unidades, tipos de refeição, categorias de marcador), constantes (faixas padrão), e schemas **Zod** usados tanto para validação de formulário no app quanto (via adapter) na API.

## Justificativa
- Você já domina Swagger/OpenAPI — não precisa aprender um paradigma novo.
- Mantém a API como um contrato REST padrão de mercado, reutilizável por terceiros/portfólio (fácil de mostrar em entrevista: "aqui está minha OpenAPI spec").
- Codegen elimina a maior dor de REST (digitar DTOs duas vezes) sem acoplar app e API no mesmo processo de build/deploy como tRPC exigiria.

## Alternativa descartada: tRPC
Elimina 100% da duplicação de tipos com ótima DX, e funciona com React Native. Mas: acopla fortemente cliente e servidor ao mesmo monorepo/versão (dificulta expor a API para uso externo ou por um app público no futuro), é uma tecnologia a mais para aprender no meio de um projeto com prazo, e é menos "padrão de mercado" para portfólio do que uma API REST com OpenAPI bem documentada. Descartado para o MVP; reavaliar se o produto nunca precisar de API pública.
