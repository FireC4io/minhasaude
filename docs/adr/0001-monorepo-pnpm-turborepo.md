# ADR-0001: Monorepo com pnpm workspaces + Turborepo

## Status
Recomendado (aguardando confirmação)

## Contexto
Precisamos decidir entre repositórios separados (api / mobile) ou um monorepo. O projeto compartilha tipos de domínio (DTOs, enums de unidades, schemas de validação) entre backend e mobile, e é mantido por uma única pessoa.

## Decisão
Monorepo único, gerenciado com **pnpm workspaces** para instalação/linkagem de pacotes e **Turborepo** para orquestrar build/test/lint com cache local.

Estrutura de packages:
- `apps/api` (NestJS)
- `apps/mobile` (Expo/React Native)
- `packages/shared` (tipos, enums, schemas Zod, catálogo de calculadoras)
- `packages/config` (eslint/tsconfig compartilhados)

## Justificativa
- Desenvolvedor único: overhead de coordenar 2 repositórios (versionamento de pacote compartilhado, releases sincronizados) não compensa para este porte de projeto.
- Mudança de contrato (ex.: novo campo em DTO) fica em um único commit atômico, revisável em um PR.
- pnpm workspaces é leve, rápido, e não exige aprender uma ferramenta nova além do gerenciador de pacotes.
- Turborepo é simples de configurar (um `turbo.json`), tem cache incremental que ajuda quando os dois apps crescerem, e é mantido pela Vercel (boa integração se o backend algum dia rodar lá).

## Alternativa descartada: Nx
Nx é mais poderoso (geradores, grafo de dependências, plugins para Nest e Expo), mas tem curva de aprendizado maior e convenções mais opinativas — overhead desnecessário para um projeto solo. Reavaliar se o time crescer.

## Alternativa descartada: repositórios separados
Mais simples individualmente, mas: duplicação de tipos/validações (ou publicação de um pacote npm privado só para isso, o que é overhead maior ainda), PRs de mudanças cross-cutting em dois lugares, dois pipelines de CI para manter sincronizados. Descartado.
