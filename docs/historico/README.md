# Histórico do projeto

Registro do que aconteceu e por quê. Não é lido no início da sessão: o `CLAUDE.md` traz as regras vigentes e o
`docs/plano-proxima-sessao.md` traz o estado da fase atual. Consultar aqui quando precisar do motivo de uma
decisão, do contexto de um incidente ou de como um problema antigo foi resolvido.

| Arquivo | O que tem |
| --- | --- |
| [`contexto-ate-2026-10-10.md`](contexto-ate-2026-10-10.md) | O antigo bloco "Active Context" do CLAUDE.md, das Fases 1 a 5: issues concluídas, incidente de produção de 07/10, diagnósticos (inclusive os que se revelaram errados), validações visuais, troca do pnpm, reordenação do roadmap. |
| [`noite-2026-10-06.md`](noite-2026-10-06.md) | Noite autônoma de 06→07/10 e as decisões do dono da manhã de 07/10. |
| [`../referencia-mfp.md`](../referencia-mfp.md) | Percurso comentado pelo dono no MyFitnessPal e as decisões que saíram dele. |
| Backlogs [`backlog-fase1.md`](backlog-fase1.md) a [`backlog-fase4.md`](backlog-fase4.md) | Detalhe por issue de cada fase. |
| [`plano-2026-10-07.md`](plano-2026-10-07.md) | Plano de 07 a 10/10 (exclusão de conta, relatório, busca, idiomas, qualidade), concluído. |
| [`estrutura-pastas.md`](estrutura-pastas.md) | Proposta inicial de pastas do monorepo (Fase 1). O código seguiu outro desenho; vale como registro. |

## Como registrar daqui pra frente

Ao fim de uma sessão com algo que valha guardar, acrescentar um arquivo `AAAA-MM-DD-assunto.md` aqui (o que foi
feito, decisões, achados) e uma linha na tabela acima. Regra nova que vale para todo código vai para o `CLAUDE.md`;
o relato de como se chegou nela fica aqui.

## Ferramentas aposentadas

- **graphify + vault do Obsidian** (2026-09-17 a 2026-10-10): grafo de conhecimento gerado do código e dos docs.
  Aposentado em 2026-10-11 por decisão do dono: em 15 sessões foi reconstruído cerca de 9 vezes (~700 mil tokens)
  e nunca consultado; ficava desatualizado, pulava arquivos `.tsx` por bug do extrator e acumulava notas mortas.
  Substituído por: busca direta + Serena (símbolos), Melchizedek (sessões passadas), este histórico e o mapa do
  dependency-cruiser (`docs/arquitetura/dependencias.md`).
