# Básicos do USDA (o que a TACO não tem)

A TACO não tem vários alimentos que as pessoas comem todo dia: leite de vaca líquido (está "em revisão"), macarrão
cozido (só cru), pão de forma branco (só integral) e quase nenhum industrializado (salsicha, nuggets, pizza,
refrigerante zero, suco de caixinha). Sem eles, a busca falha justamente no uso do dia a dia.

## Fonte

U.S. Department of Agriculture, Agricultural Research Service. *FoodData Central*. Domínio público (CC0 1.0); o USDA
pede que a fonte seja creditada. Guia: https://fdc.nal.usda.gov/api-guide.html

- **FNDDS 2024-10-31** (Survey): os alimentos "como se come" da pesquisa de consumo dos EUA. Todos os nutrientes que o
  app usa vêm preenchidos, e cada alimento traz medidas caseiras em gramas.
- **SR Legacy 2018-04**: alimentos genéricos, para o que o FNDDS não tem do jeito certo (queijo cottage, whey).

Descartadas: TBCA/USP (uso dentro de outro app exige licença paga) e chamar a API do USDA ao vivo (o app não precisa
falar com o USDA: os números ficam no nosso banco).

## Como o arquivo é gerado

`scripts/alimentos-usda/lista.py` é a lista revisada: nome em português, base e `fdc_id`. `build.py` lê os CSV do
download do USDA (https://fdc.nal.usda.gov/download-datasets) e grava:

- `apps/api/src/database/seeds/data/usda-foods.csv`: macros e micronutrientes por 100 g e a descrição original do USDA;
- `apps/api/src/database/seeds/data/usda-portions.csv`: as medidas caseiras do próprio USDA, com o texto de origem.

```bash
python scripts/alimentos-usda/build.py <pasta FNDDS> <pasta SR Legacy> \
  apps/api/src/database/seeds/data/usda-foods.csv apps/api/src/database/seeds/data/usda-portions.csv
```

A migration `SeedUsdaBasics` carrega os dois arquivos (`source = 'usda'`, `external_id` = `fdc_id`), sem repetir o
que já existe. Item novo: acrescentar na lista, gerar de novo e criar outra migration chamando `insertUsdaBasics`.

## Regras

- Só entra o que a TACO não tem. O teste `usda-catalog.spec.ts` recusa nome igual a um da TACO e confere se os macros
  batem com as calorias (exceto bebida alcoólica, cujo álcool soma calorias fora dos macros).
- Nome em português do jeito que a pessoa procura ("Pão de forma, branco", "Salsicha"), revisado pelo dono na página
  de conferência (https://claude.ai/artifact/JfWsHhmS2xZjBNYx3iHz27). Em 2026-10-11: 130 alimentos e 121 medidas.
- Medidas: só as que fazem sentido. Xícara apenas em líquido, cremoso ou grão miúdo; medidas enganosas ficam em
  `DESCARTAR` (batata "waffle" é o formato, não "1 waffle"; "1 pacote" de gelatina é o que rende a caixa).
- Valor que a fonte não mediu fica `null`, nunca zero.
- O app mostra "dados do USDA (EUA)" no resultado da busca e o crédito na tela Sobre: são números de alimentos
  americanos, parecidos mas não idênticos aos brasileiros (o leite integral de lá tem 3,25% de gordura; o daqui, ~3%).

## Óleos e azeites

Os 8 óleos e azeites estavam na TACO com 100 g de gordura, mas sem proteína e carboidrato, e por isso ficavam fora do
banco. Gordura pura não tem espaço para os dois, então o leitor (`taco-catalog.ts`) passou a usar zero quando a
gordura é 100 g. Os micronutrientes não medidos continuam `null`. Entraram com a migration `AddTacoPureFats`, junto
das medidas do IBGE (colher de sopa, chá, sobremesa).
