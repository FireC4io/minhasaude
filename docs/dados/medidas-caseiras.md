# Medidas caseiras (colher, unidade, fatia)

Quem não tem balança anota "2 colheres de sopa de arroz" em vez de "50 g". As medidas dos alimentos da TACO
vêm de uma fonte pública, com cada valor rastreável até a linha de origem.

## Fonte

IBGE. *Pesquisa de Orçamentos Familiares 2008-2009: Tabela de Medidas Referidas para os Alimentos Consumidos
no Brasil*. Rio de Janeiro, 2011. PDF: https://biblioteca.ibge.gov.br/visualizacao/livros/liv50000.pdf

É publicação oficial do governo federal, usada para converter medida caseira em gramas no inquérito de consumo
alimentar. O crédito aparece na tela "Sobre" (`account.about.ibge`), ao lado da TACO e do Open Food Facts.

## Como o arquivo é gerado

`apps/api/src/database/seeds/data/taco-portions.csv` sai de três scripts em `scripts/medidas-ibge/`:

1. `parse.py` lê o PDF (precisa de PyMuPDF) e devolve as ~11 mil linhas da tabela (alimento, preparação,
   medida, gramas, fonte). As páginas da tabela são giradas: cada linha da tabela é uma coluna de texto.
2. `mapping.py` liga cada alimento da TACO a um item e uma preparação do IBGE (ex.: "Arroz, tipo 1, cozido"
   → 6300101 Arroz, "não se aplica"; "Frango, peito, sem pele, grelhado" → 7800401 Peito de frango, grelhado).
3. `build.py` escolhe as medidas e grava o CSV. Cada linha guarda o código do item, da preparação e da medida
   no IBGE e o texto da fonte, para conferência.

```bash
python scripts/medidas-ibge/parse.py liv50000.pdf medidas-ibge.csv
python scripts/medidas-ibge/build.py medidas-ibge.csv apps/api/src/database/seeds/data/taco.csv \
  apps/api/src/database/seeds/data/taco-portions.csv
```

A migration `SeedIbgePortions` carrega o CSV no deploy (idempotente). Alimento novo ou correção: mudar
`mapping.py`/`build.py`, gerar de novo e criar outra migration que aplique a diferença.

## Regras de escolha

- Só medidas que fazem sentido para quem anota: unidade, fatia, pedaço, colheres (sopa, sobremesa, chá,
  servir), concha, escumadeira, xícara, copo, lata, bife, filé, folha, punhado, ponta de faca, pacote. Ficam
  de fora prato, pires, tigela, "porção" do Guia Alimentar e afins.
- A descrição da fonte precisa citar a medida. O IBGE preencheu medidas que faltavam com equivalências
  ("caneca de arroz = prato fundo raso"); essas são descartadas.
- Nunca "diluição para preparo" (quanto de fruta ou pó vai num copo de suco): não é porção do alimento.
- Copo e lata genéricos (só o volume em ml) apenas em bebidas — fruta crua não ganha "copo" vindo do suco.
- Uma lista curta de adaptações que não servem ao alimento da TACO é recusada à mão (`DROP` em `build.py`),
  por exemplo "unidade" de frango inteiro, que na fonte é uma coxa.
- Leite de vaca líquido não entra: a TACO deixou em revisão e o seed o pula. Ele vem do USDA, com as medidas
  do próprio USDA (`docs/dados/alimentos-usda.md`). Os óleos e azeites entraram depois, com zero de proteína e
  carboidrato (são 100% gordura).

Resultado em 2026-10-11: 742 medidas para 341 alimentos (com os óleos e azeites).

## No app

- O texto da medida vem da tradução (`portions.kinds.*`), então "colher de sopa" vira "tablespoon" e
  "cucharada" sem mudar o banco. O código (`PORTION_KINDS`) fica no shared.
- A tela avisa que medida caseira é aproximada.
- A pessoa cria a própria medida ("minha caneca = 180 g"), visível só para ela, até 10 por alimento. Entra
  na exportação LGPD (`customPortions`).
- Em inglês o app também oferece onça (oz); grava sempre em gramas.
