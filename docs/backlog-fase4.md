# Backlog — Fase 4: Refundação da interface (formato de issues do GitHub)

> Copiar cada bloco como uma issue no GitHub (`gh issue create`), como foi feito nas Fases 1-3. Ver `docs/roadmap.md` para o entregável da fase.

**Por que esta fase existe**: o roadmap foi reordenado em 2026-09-25 (ver nota no `roadmap.md`) para que os exames — o diferencial do produto — venham antes da publicação. Exames são a maior superfície de UI do projeto: upload, revisão de valores, resultados e índices. Construí-los sobre a base atual significaria refazer acessibilidade duas vezes. Esta fase prepara a base.

**Auditoria que motivou a fase** (2026-09-25, contagem no código real de `apps/mobile/src`):

| Medida | Valor |
|---|---|
| Elementos tocáveis (`Pressable`/`Touchable`) | 39 |
| Com `accessibilityLabel` | 0 |
| Com `accessibilityRole` | 0 |
| Com `accessibilityState` | 0 |
| Que tratam escala de fonte | 0 |
| Alvo de toque dos chips do onboarding | ~36 dp (mínimo recomendado: 48 dp) |
| Alvo de toque dos botões primários | ~44 dp |

**Norma de referência**: **ABNT NBR 17060:2022** — primeira norma brasileira de acessibilidade digital específica para apps de dispositivos móveis (54 requisitos alinhados ao WCAG, válida para nativos, web e híbridos). Dá base ao art. 63 da LBI (Lei 13.146/2015), cuja regulamentação por decreto começou a tramitar em 2025. Ressalva honesta: o texto do art. 63 fala em *sites*, não explicitamente em apps — hoje isto é postura e preparação, não obrigação líquida e certa. Para um app de saúde com usuários reais, e como peça de portfólio, compensa.

**Ordem de dependência entre issues**: 22 primeiro (os componentes base são a fundação das outras); 23, 24 e 25 podem rodar em paralelo depois; 26 fecha a fase validando com leitor de tela real.

---

### 22. Componentes base acessíveis por construção
**Contexto**: hoje `PrimaryButton`, `AuthTextField` e `SelectChips` não expõem nenhuma prop de acessibilidade, e são reaproveitados em quase toda tela. Corrigir na raiz propaga para o app inteiro e faz as telas de exame (Fase 5) nascerem prontas.

- [ ] `PrimaryButton`: `accessibilityRole="button"`, `accessibilityState={{ disabled, busy }}`, rótulo derivado do `label`, e `accessibilityHint` opcional para ações cujo resultado não é óbvio
- [ ] `AuthTextField`: associar rótulo visível ao campo, `accessibilityLabel` quando o rótulo não bastar, e anunciar erro de validação (não só pintar de vermelho)
- [ ] `SelectChips`: `accessibilityRole="radio"` por chip, `accessibilityState={{ selected }}`, e o grupo com rótulo próprio
- [ ] Alvo de toque mínimo de 48 dp em todos os três — hoje chips estão em ~36 dp e botões em ~44 dp. Usar `hitSlop` onde aumentar o padding quebrar o layout
- [ ] Teste unitário da lógica de props (função pura que monta as props de acessibilidade), já que teste de render é não-confiável neste ambiente — ver gotcha no `CLAUDE.md`

**Critério de aceite**: um leitor de tela anuncia papel, rótulo e estado de cada um dos três componentes; nenhum alvo de toque abaixo de 48 dp.

---

### 23. Acessibilidade nas telas existentes
**Contexto**: as 9 telas já validadas visualmente (2026-09-24) seguem mudas para leitor de tela. Com a issue 22 pronta, sobra o que é específico de cada tela.

- [ ] Ícones e controles sem texto ganham rótulo — as setas `‹`/`›` de navegação entre dias do diário são hoje dois caracteres sem significado anunciado
- [ ] `accessibilityRole="header"` nos títulos de tela e de seção (refeições, histórico)
- [ ] Gráfico de peso com `accessibilityLabel` descrevendo a tendência em texto — um SVG é invisível para leitor de tela
- [ ] Listas do diário e do histórico com rótulo que junte as informações da linha ("Banana, prata, crua, 130 gramas, 128 quilocalorias") em vez de ler célula por célula
- [ ] Estados de carregamento e erro anunciados (`accessibilityLiveRegion` no Android, `AccessibilityInfo.announceForAccessibility` quando fizer sentido)
- [ ] Ordem de foco conferida em cada tela

**Critério de aceite**: dá para completar o fluxo de registrar um alimento e um peso usando só o leitor de tela, sem enxergar a tela.

---

### 24. Escala de fonte e responsividade
**Contexto**: nenhum componente trata escala de fonte hoje. Usuário que aumenta a fonte do sistema — principal recurso de acessibilidade visual — pode quebrar o layout.

- [ ] **Não** desligar escala de fonte globalmente. Onde o layout quebrar, usar `maxFontSizeMultiplier` — nunca abaixo de 1.2
- [ ] Conferir cada tela com a fonte do sistema no tamanho máximo; texto que estoura deve quebrar linha ou rolar, nunca ser cortado
- [ ] Trocar `Dimensions.get` por `useWindowDimensions` — o primeiro lê uma vez e não reage a rotação nem a tela dividida
- [ ] Revisar larguras fixas e `minWidth` que impeçam o conteúdo de caber em telas estreitas
- [ ] Conferir o app em tela larga (tablet/web) — hoje o gráfico de peso estica para ~1800 px sem limite de largura

**Critério de aceite**: com a fonte do sistema no máximo, nenhuma tela corta texto nem esconde botão; girar o device recalcula o layout.

---

### 25. Telas que faltam: perfil, exportar dados, excluir conta
**Contexto**: a API resolve as três desde a Fase 1 (`GET /v1/me`, `GET /v1/me/export`, `DELETE /v1/me` — esta última com purge real desde 2026-09-25), mas o app não oferece nenhuma. São direitos de LGPD que hoje só existem via chamada HTTP.

- [ ] Tela de perfil: dados da conta e do perfil, com edição do que o onboarding coletou
- [ ] Exportar dados: dispara `GET /v1/me/export` e entrega o arquivo ao usuário
- [ ] Excluir conta: explica o prazo de 30 dias e o que será apagado, exige confirmação explícita, e deixa claro que o consentimento fica anonimizado como prova
- [ ] Ambas as ações de LGPD alcançáveis em no máximo dois toques a partir do app
- [ ] Texto informativo, nunca alarmista

**Critério de aceite**: um usuário consegue exportar os próprios dados e pedir exclusão da conta sem sair do app.

---

### 26. Identidade Gota Vital aplicada + validação com leitor de tela
**Contexto**: paleta aprovada em 2026-09-18 e já aplicada em cores, mas as fontes (Fredoka/Work Sans/JetBrains Mono) nunca foram carregadas e o set de ícones não existe — a aba Peso ainda usa o PNG do template do Expo. Fecha a fase validando o conjunto.

- [ ] Carregar as três fontes no app (`expo-font`), com fallback declarado
- [ ] Set de ícones próprio para as abas, substituindo os PNGs do template
- [ ] Barra de abas usando a paleta Gota Vital em vez do tema do template (`src/constants/theme.ts`)
- [ ] Passar o app inteiro no **TalkBack** (Android) e no **VoiceOver** (iOS), anotando o que falhar
- [ ] Conferir contraste dos pares texto/fundo nos dois temas — o bug de 2026-09-24 mostrou que dark mode quebra em silêncio

**Critério de aceite**: app com a identidade aplicada de ponta a ponta e uma passada completa de leitor de tela registrada, com os achados corrigidos ou anotados.
