# ADR-0004: Busca de alimentos com Postgres (trigram + FTS), Open Food Facts sob demanda

## Status
Recomendado (aguardando confirmação — depende da resposta sobre orçamento)

## Contexto
Base de alimentos vem de três fontes: TACO (Unicamp, ~600 itens, importação única), Open Food Facts (milhões de produtos globais, licença ODbL), e cadastros do próprio usuário. Precisamos decidir mecanismo de busca e estratégia de ingestão do OFF.

## Decisão
1. **Busca**: PostgreSQL nativo — `pg_trgm` (fuzzy match / tolerância a erro de digitação) + `unaccent` (ignorar acentos) + índice GIN combinado sobre nome do alimento. Sem serviço de busca dedicado no MVP.
2. **TACO**: importação única via script de seed (CSV/JSON → tabela `foods` com `source = 'taco'`), rodando em CI ou manualmente uma vez.
3. **Open Food Facts**: **não importar a base inteira**. Buscar sob demanda na API pública do OFF quando o usuário pesquisar e não encontrar na base local; cachear o resultado localmente (`source = 'off'`) na primeira vez que for usado. Reduz custo de storage e evita importar milhões de produtos irrelevantes para o usuário brasileiro.
4. **Atribuição obrigatória**: tela de "Sobre"/rodapé com créditos à TACO/Unicamp e ao Open Food Facts sob licença ODbL (ver seção de licenças no CLAUDE.md).

## Justificativa
- Volume esperado no MVP (TACO + itens OFF vistos sob demanda + cadastros de usuário) fica na casa de milhares a dezenas de milhares de linhas — Postgres com índice trigram é rápido o suficiente e não exige infraestrutura nova.
- Custo zero adicional de infra é importante dado o perfil de projeto (portfólio, custo inicial baixo).
- Busca sob demanda no OFF é mais realista: a base completa do OFF é enorme e majoritariamente irrelevante (produtos de outros países), e a API pública já permite busca por nome/EAN em tempo real.

## Alternativa descartada: Meilisearch/Typesense
Excelente DX de busca instantânea e tolerante a erro "pronta para uso", mas é mais um serviço para hospedar e pagar. Reavaliar na Fase 6 se a busca por trigram se mostrar insuficiente (ex.: usuários reclamando de relevância).

## Alternativa descartada: importar Open Food Facts inteiro
O dump completo do OFF tem múltiplos GB e majoritariamente produtos não vendidos no Brasil. Importar tudo infla o banco sem benefício proporcional e complica a Fase 1 com um pipeline de ETL grande antes de ter qualquer usuário. Descartado para o MVP.
