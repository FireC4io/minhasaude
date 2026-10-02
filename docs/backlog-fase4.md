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

**Fase ampliada em 2026-10-02 (decisão do usuário)**: o objetivo deixou de ser só "acessível" e passou a ser **um app bom e eficiente para todos os públicos** — pessoa idosa, com baixa visão, com pouca familiaridade com tecnologia, com celular básico e internet ruim. As issues #30 e #31 (concluídas) viraram o Bloco A; o resto foi reorganizado em blocos. Itens novos têm id provisório `F4-xx` até virarem issue no GitHub.

**Ordem de dependência**: A (feito) → B (ambiente) → C (identidade, porque mexe na paleta que todo o resto usa) → D, E e F em paralelo → G (desempenho) → H fecha a fase.

---

### 30. Componentes base acessíveis por construção
**Contexto**: hoje `PrimaryButton`, `AuthTextField` e `SelectChips` não expõem nenhuma prop de acessibilidade, e são reaproveitados em quase toda tela. Corrigir na raiz propaga para o app inteiro e faz as telas de exame (Fase 5) nascerem prontas.

- [x] `PrimaryButton`: `accessibilityRole="button"`, `accessibilityState={{ disabled, busy }}`, `accessibilityLabel` sempre presente (durante o loading o texto some da tela e sobraria um botão anônimo), e `accessibilityHint` opcional
- [x] `AuthTextField`: `accessibilityLabel` no input (o rótulo é um `Text` irmão, que o leitor de tela não associa sozinho); erro vira `accessibilityRole="alert"` + `accessibilityLiveRegion="polite"` e também entra no `accessibilityHint` do campo
- [x] `SelectChips`: `accessibilityRole="radio"` por chip com `{ selected, checked }` (iOS lê `selected`, Android lê `checked`); grupo com `radiogroup` + rótulo, **sem** `accessible` — se fosse acessível viraria uma única parada de foco e os chips deixariam de ser focáveis um a um
- [x] Alvo de toque mínimo de 48 dp via `MIN_TOUCH_TARGET` em `src/constants/accessibility.ts`, aplicado como `minHeight` e não como `hitSlop` — aumentar o alvo de verdade ajuda a *enxergar* onde tocar, e em linha com quebra o `hitSlop` ainda arriscaria sobrepor o vizinho
- [x] **Teste de render de verdade** — 18 testes novos (`primary-button.spec.tsx` 7, `auth-text-field.spec.tsx` 5, `select-chips.spec.tsx` 6), os primeiros testes de tela do projeto. Usam `await render(...)` + `screen.getByRole(...)`. Matchers do v14: `toBeDisabled`/`toBeBusy`/`toBeChecked`/`toHaveProp`/`toHaveStyle` (o antigo `toHaveAccessibilityState` não existe mais)
- [x] **Brinde**: `tsc --noEmit` do mobile saiu de **179 erros para 0** — faltava `"types": ["jest"]` no tsconfig, então todo arquivo `.spec` acusava `describe`/`expect` inexistentes e o typecheck não servia como gate

**Critério de aceite**: um leitor de tela anuncia papel, rótulo e estado de cada um dos três componentes; nenhum alvo de toque abaixo de 48 dp.

---

### 31. Acessibilidade nas telas existentes
**Contexto**: as 9 telas já validadas visualmente (2026-09-24) seguem mudas para leitor de tela. Com a issue #30 pronta, sobra o que é específico de cada tela.

- [x] Ícones e controles sem texto ganham rótulo — `‹`/`›` viram "Dia anterior"/"Próximo dia", e a troca de dia é anunciada (o foco fica na seta e o leitor não diria para qual dia foi). Ações em texto soltas ("Sair", "+ Adicionar alimento", "Remover", "Trocar alimento", "Remover entrada", "Copiar refeições") viraram o componente `TextButton` (`src/components/ui/text-button.tsx`): papel `button`, nome falado, estado e alvo de 48 dp nas duas dimensões. Cada "Remover" diz qual alimento remove, e cada "+ Adicionar" diz em qual refeição
- [x] `accessibilityRole="header"` nos títulos das 9 telas, nas seções de refeição e no "Histórico"
- [x] Gráfico de peso como `role="image"` com a tendência descrita em texto (`describeWeightTrend`: período, primeiro e último valor, variação e extremos). Redação neutra — "redução"/"aumento", sem julgar (RDC 657/2022)
- [x] Linhas lidas como uma frase: entrada do diário ("Banana, prata, crua, 130 gramas, 128 quilocalorias"), cabeçalho de refeição com total, card de macros, card de meta do onboarding e linhas do histórico de peso. Unidades por extenso e vírgula decimal (`src/features/accessibility/spoken-format.ts`), porque "g", "kcal/dia" e "set." são soletrados ou lidos errado. Plural pela norma culta: "1,5 quilo"
- [x] Carregamento e erro anunciados: `FormError` (alerta + `liveRegion` no Android, `announceForAccessibility` só no iOS, para o TalkBack não falar duas vezes) substitui os 8 erros que eram só texto vermelho; `LoadingIndicator` diz o que está carregando; a busca de alimento anuncia quantos resultados vieram; o resumo da meta anuncia o valor calculado quando o botão "Calcular" some da tela
- [ ] Ordem de foco conferida em cada tela — **conferida só por leitura de código** (a ordem do JSX segue a ordem visual em todas as telas). A linha do diário foi reestruturada: editar e remover viraram irmãos, porque um `Pressable` acessível engole os filhos e o "Remover" sumiria para o leitor. Falta conferir com TalkBack/VoiceOver de verdade — fica para a passada da issue #34

**Achados de passagem, corrigidos**: o card de resumo dizia "kcal restantes **hoje**" mesmo ao ver outro dia, e o botão "Copiar refeições **de ontem**" copiava o dia anterior ao *exibido*, não ontem. Os dois textos foram corrigidos.

**Testes**: 41 novos (49 → 90 no mobile) — funções de rótulo puras e render de `TextButton`, `FormError`, `MealSection`, `MacroSummary`, `WeightChart` e `WeightHistoryList`.

**Validação no navegador (2026-10-02)** — árvore de acessibilidade lida no Expo web (o RN web traduz `accessibilityRole`/`Label` para ARIA) e fluxos de alimento e peso feitos por teclado. Papéis, nomes falados, live regions e a descrição do gráfico chegaram certos. Ordem de Tab segue a ordem visual no diário. Dois bugs que nenhum teste pegava, corrigidos:
- **O alvo de 48 dp não existia no app real.** `TextButton` e `PrimaryButton` passavam `className` junto de `style` em forma de função; o NativeWind junta os dois num array e o `Pressable` só chama `style` quando ele *é* a função — dentro do array ela é ignorada. Medido no DOM: "Sair" 23×20, setas 8×32, "+ Adicionar" 134×19, "Salvar" 43 de altura; também sumia a opacidade de pressionado/desabilitado. O `toHaveStyle` dos testes passava porque o Jest não roda o NativeWind. Agora `style` é objeto e a opacidade vai por classe (`active:opacity-70`/`opacity-50`); teste novo trava que o `style` seja objeto. **Regra: em `Pressable` com `className`, nunca `style={({ pressed }) => ...}`.** Efeito colateral bom: o "Hoje" do cabeçalho do diário, que ficava atrás da barra de abas, apareceu.
- **Vírgula decimal recusada.** `Number('69,2')` é `NaN`, então "69,2" dava "Informe um peso válido" nas duas telas de peso (a altura do perfil tinha o mesmo `Number(...)`). Helper `parseDecimal` em `src/features/forms/` (5 testes) aplicado nas 4 telas.

**Observado, não corrigido**: o modal de adicionar alimento deixa o diário de trás na árvore de acessibilidade no web (sem `aria-modal`); após registrar peso o foco cai no `body` sem anúncio de sucesso; recarregar direto em `/weight` cai no Diário; o histórico mostra "68.9 kg" com ponto enquanto a fala usa vírgula.

**Critério de aceite**: dá para completar o fluxo de registrar um alimento e um peso usando só o leitor de tela, sem enxergar a tela.

---

**Referência de telas (2026-10-02)**: o dono do projeto gravou um vídeo percorrendo o MyFitnessPal e comentando o que quer. O registro tela a tela, com a classificação por fase e as decisões pendentes, está em `docs/referencia-mfp.md`; os itens F4-30 a F4-36 vêm dele.

## Achados de 2026-10-02 que alimentaram a ampliação

Primeira passada no **emulador Android** (Android Studio, aparelho médio, API 37), com conta nova criada do zero. As telas capturadas estão no relatório visual.

| # | Achado | Onde | Vai para |
|---|---|---|---|
| 1 | **Contraste da cor de ação reprova no modo claro**: texto creme sobre botão mamão e "+ Adicionar" mamão sobre areia dão **2,45:1** (mínimo 4,5:1; nem como texto grande passa). Maracujá sobre areia: 2,62:1. No escuro está ok (7,27:1) | Botão primário e todo `TextButton` | F4-07 |
| 2 | **Linha de macros se atropela com fonte em 200%**: "4g / 100g0g / 64g42g / 278g" | Card do diário | #32 |
| 3 | **Teclado esconde o botão principal** e a tela não rola — no registro é preciso fechar o teclado para achar "Criar conta" | Login, registro, perfil, peso | F4-14 |
| 4 | Data de nascimento é texto livre em **AAAA-MM-DD** | Onboarding | F4-15 |
| 5 | Placeholder do peso é "70.5", com ponto | Peso (onboarding e app) | F4-15 |
| 6 | O consentimento promete exportar/excluir "nas configurações do app", e essa tela não existe | Consentimento | #33 |
| 7 | **Ícone do app e splash ainda são o logo do Expo** | Inicialização | F4-06 |
| 8 | Barra de abas fica preta no modo escuro, fora da paleta; ícone da aba Peso é do template | Abas | F4-06 |
| 9 | O gráfico mostra máximo e mínimo lado a lado no topo, sem eixo — lê-se como "início → fim" | Peso | F4-17 |
| 10 | "Copiar refeições do dia anterior" aparece para conta criada hoje, que não tem dia anterior | Diário | F4-16 |
| 11 | Na web, o modal deixa o diário de trás acessível ao leitor de tela; registrar peso não anuncia sucesso | Modal, peso | #34, F4-16 |

Conferido e ok no Android: vírgula decimal aceita, cálculo da meta (Mifflin-St Jeor, 36 anos/170 cm/62,4 kg → 1.346 / 2.086 kcal), nomes falados das linhas, gráfico descrito em texto, conteúdo no modo escuro.

---

## Bloco A — Fundação acessível ✅
Issues **#30** e **#31** acima.

---

## Bloco B — Ambiente de validação real

### F4-01. Emulador Android como ferramenta do dia a dia
**Contexto**: até 2026-10-02 toda validação visual era no Expo web, que esconde problemas reais (teclado, fonte do sistema, TalkBack, tema do sistema). O emulador já funciona; falta deixar isso reproduzível.
- [ ] Documentar no README do mobile: AVD num disco com espaço (o C: não comporta os 12 GB da partição de dados — AVD em `D:\Android\avd` via `ANDROID_AVD_HOME`), `adb reverse tcp:3000` e `tcp:8081` para o app falar com a API local sem mudar `.env`, e `npx expo start --android`
- [ ] Script de captura de telas versionado (hoje é um helper solto da sessão), que gera os prints do relatório visual
- [ ] Perfil de aparelho básico (tela pequena, 2 GB de RAM) além do aparelho médio

### F4-02. Testes de fluxo ponta a ponta no emulador (Maestro)
**Contexto**: os bugs mais sérios até aqui (alvo de 48 dp, gráfico que não desenhava, abas engolindo cliques) passaram por todos os testes unitários. Só aparecem com o app rodando.
- [ ] Maestro (gratuito, fluxos em YAML) com os fluxos críticos: registrar → onboarding → adicionar alimento → registrar peso → sair
- [ ] Os mesmos fluxos com fonte em 200% e em modo escuro
- [ ] Rodar localmente antes de fechar cada issue; CI fica para depois (emulador em CI gasta minutos que o orçamento não cobre)

---

## Bloco C — Identidade Gota Vital e sistema de design

### F4-05. Tipografia e escala tipográfica
- [ ] Carregar Fredoka (títulos), Work Sans (texto) e JetBrains Mono (números) via `expo-font`, com fallback
- [ ] Escala tipográfica com nomes (título, subtítulo, corpo, legenda, número) em vez de `text-sm`/`text-base` soltos
- [ ] Números de nutrição e peso com algarismos tabulares, para as colunas alinharem

### F4-06. Ícone, splash, ícones das abas e barra de abas
- [ ] Ícone do app e splash com o símbolo Gota Vital (hoje: logo do Expo)
- [ ] Set de ícones próprio para as abas
- [ ] Barra de abas pintada com a paleta nos dois temas (hoje usa `constants/theme.ts` do template e fica preta no escuro)
- [ ] Remover os resquícios do template (`animated-icon.tsx`, `themed-text.tsx`, `constants/theme.ts`)

### F4-07. Paleta com contraste aprovado ⚠️ decisão de design
**Contexto**: achado #1 — a cor de ação reprova no modo claro.
- [ ] Criar uma variante da cor de ação para texto e para fundo de botão que passe 4,5:1, mantendo o mamão atual para áreas grandes e decorativas
- [ ] Mesmo tratamento para o maracujá
- [ ] Teste automatizado que calcula o contraste de cada par texto/fundo dos tokens, nos dois temas, e reprova abaixo de 4,5:1
- [ ] **Precisa da aprovação do usuário**: altera a identidade aprovada em 2026-09-18

### F4-08. Catálogo de componentes
- [ ] Tela só de desenvolvimento com cada componente base em todos os estados (normal, pressionado, desabilitado, carregando, erro), nos dois temas — referência visual para revisar

---

## Bloco D — Inclusão ampla (para todos os públicos)

### 32. Escala de fonte e responsividade
**Contexto**: o achado #2 confirma a quebra.
- [ ] **Não** desligar a escala de fonte globalmente. Onde o layout quebrar, usar `maxFontSizeMultiplier` — nunca abaixo de 1.2
- [ ] Linha de macros do card do diário: empilhar em fonte grande em vez de dividir a linha em três
- [ ] Conferir cada tela com a fonte do sistema em 200%; texto que estoura deve quebrar linha ou rolar, nunca ser cortado
- [ ] Trocar `Dimensions.get` por `useWindowDimensions`
- [ ] Revisar larguras fixas e `minWidth` que impeçam o conteúdo de caber em telas estreitas
- [ ] Largura máxima de conteúdo em tela larga (tablet/web) — hoje o gráfico estica até ~1800 px

**Critério de aceite**: com a fonte do sistema em 200%, nenhuma tela corta texto nem esconde botão; girar o aparelho recalcula o layout.

### F4-10. Não depender só de cor
- [ ] Estados (selecionado, erro, progresso) sempre com texto ou forma além da cor — pensando em daltonismo
- [ ] Gráfico com marcadores e rótulos legíveis em escala de cinza

### F4-11. Movimento reduzido
- [ ] Respeitar a preferência "remover animações" do sistema (`AccessibilityInfo.isReduceMotionEnabled`) em toda animação

### F4-12. Linguagem simples
**Contexto**: o público inclui pessoas com pouca familiaridade com termos de nutrição.
- [ ] Revisar textos: sem abreviação ("Carbo" → "Carboidratos"), siglas explicadas na primeira aparição (TMB), frases curtas
- [ ] Explicação curta a partir do card de meta ("o que é taxa metabólica?") — informativa, nunca prescritiva (RDC 657/2022)
- [ ] Mensagens de erro dizem o que fazer, não só o que deu errado

---

## Bloco E — Formulários e fluxos

### F4-14. O teclado nunca esconde a ação
- [ ] `KeyboardAvoidingView` + rolagem em toda tela com formulário (achado #3)
- [ ] Botão "próximo" do teclado leva ao campo seguinte; no último campo, envia
- [ ] Tipo de teclado certo em cada campo (decimal para peso e quantidade, e-mail para e-mail)

### F4-15. Entradas no formato brasileiro
- [ ] Data de nascimento com seletor de data ou máscara DD/MM/AAAA (achado #4)
- [ ] Placeholders e exemplos com vírgula decimal (achado #5)

### F4-16. Estados de tela completos
- [ ] Estado vazio explicativo em cada lista (diário sem alimento, histórico sem peso)
- [ ] "Copiar refeições do dia anterior" só quando o dia anterior tem registro (achado #10)
- [ ] Sucesso anunciado e visível ao salvar (peso registrado, alimento adicionado)
- [ ] Remover alimento com "desfazer" em vez de apagar direto
- [ ] Modal de adicionar alimento com botão de fechar visível
- [ ] Busca de alimento mostrando kcal por 100 g, para comparar opções

### F4-17. Gráfico de peso legível
- [ ] Eixo com o mínimo embaixo e o máximo em cima, datas no eixo x (achado #9)
- [ ] Escolha de período (30 dias, 3 meses, tudo)

### F4-18. Internet ruim e servidor dormindo
**Contexto**: a API no Render free dorme e leva 30-60 s para acordar. Hoje isso aparece como carregamento sem fim ou erro genérico.
- [ ] Mensagem específica quando a primeira chamada demora ("conectando ao servidor, pode levar até um minuto")
- [ ] Retentativa automática com aviso, e botão de tentar de novo em todo erro de rede
- [ ] Dados já carregados continuam visíveis sem internet (cache do React Query persistido)

---

## Bloco F — Telas que faltam e navegação

### F4-20. Arquitetura de navegação pensando nas Fases 5 e 6
**Contexto**: referência do MyFitnessPal (`docs/referencia-mfp.md`): Hoje · Progresso · Mais, com botão "+" flutuante.
- [ ] Abas: **Hoje · Progresso · Exames (Fase 5) · Perfil**, com botão "+" de registro rápido (alimento, água, peso) sempre visível
- [ ] "Sair" deixa o cabeçalho do diário e vai para o Perfil

### F4-30. Tela "Hoje" nova
**Contexto**: maior mudança de interface da fase, a partir da referência do vídeo (seção 4 de `docs/referencia-mfp.md`).
- [ ] Data tocável no topo que abre um calendário; faixa da semana (domingo a sábado) com o dia atual marcado e os dias com registro sinalizados
- [ ] Card de calorias com progresso visual (consumido, meta, restante)
- [ ] Card de macros com alternância entre restante, consumido e porcentagem, lembrando a escolha da pessoa
- [ ] Seções na ordem: Diário → Água → Peso (último registro) → Notas do dia
- [ ] Tudo funcionando com fonte em 200% e leitor de tela desde o início, não depois
- [ ] ⚠️ Decidir se entra a "sequência de dias registrando" e com que tom (motivação sem culpa)

### F4-31. Boas-vindas e onboarding em passos
- [ ] Tela de boas-vindas com 2-3 painéis ilustrados (diário, peso, exames) antes do login
- [ ] Perfil dividido em passos curtos com barra de progresso, um assunto por tela
- [ ] Exemplo concreto em cada nível de atividade (ex.: "passa a maior parte do dia sentado — trabalho de escritório")
- [ ] Ritmo semanal de perda/ganho, com a opção conservadora marcada e texto sem promessa de resultado (RDC 657/2022)

### F4-32. Recuperar senha e entrar com Google
**Contexto**: a API não tem recuperação de senha, e há usuários reais — quem esquece a senha perde a conta.
- [ ] **Recuperar senha por e-mail**: token de uso único com validade curta, guardado com hash, que revoga as sessões abertas ao trocar a senha; resposta igual para e-mail existente ou não (não revela quem tem conta); rate limit próprio
- [ ] Escolher serviço de envio de e-mail com nível gratuito, atrás de env var
- [ ] ⚠️ **Entrar com Google** (OAuth): precisa de projeto no Google Cloud e tela de consentimento — confirmar com o dono do projeto antes de começar

### F4-33. Aba Progresso (estrutura)
- [ ] Peso com gráfico e período selecionável (absorve F4-17)
- [ ] Médias semanais de calorias e macros, navegando entre semanas
- [ ] Espaço reservado para os marcadores de exame da Fase 5 (glicose e outros)

### F4-34. Histórico de alimentos recentes
- [ ] Na busca, antes de digitar, mostrar os alimentos registrados recentemente com kcal e porção, e adicionar com um toque — é o que mais acelera o registro diário

### F4-35. Água ⚠️ dado novo
**Contexto**: além de interface, exige tabela nova na API, entrada no `GET /v1/me/export` e na exclusão de conta.
- [ ] Registro com copos ilustrados (250, 500, 1.000 ml e valor livre), total do dia e meta ajustável pela pessoa — sem "recomendado" que pareça prescrição
- [ ] Decidir se fica na Fase 4 ou abre a Fase 5

### F4-36. Textos prontos para tradução
**Contexto**: o dono do projeto quer o app em outros países e idiomas no futuro. Traduzir agora não; deixar pronto, sim.
- [ ] Junto da revisão de textos (F4-12), tirar os textos de tela do código para um arquivo de traduções em pt-BR
- [ ] Datas, números e unidades sempre pelo formatador de locale (já é o caso nas funções de fala)

### 33. Telas que faltam: perfil, exportar dados, excluir conta
**Contexto**: a API resolve as três desde a Fase 1, mas o app não oferece nenhuma — e o consentimento já promete que existem (achado #6).
- [ ] Tela de perfil: dados da conta e do perfil, com edição do que o onboarding coletou e recálculo da meta
- [ ] Exportar dados: dispara `GET /v1/me/export` e entrega o arquivo ao usuário
- [ ] Excluir conta: explica o prazo de 30 dias e o que será apagado, exige confirmação explícita, e deixa claro que o consentimento fica anonimizado como prova
- [ ] As duas ações de LGPD alcançáveis em no máximo dois toques a partir do Perfil
- [ ] Texto informativo, nunca alarmista

**Critério de aceite**: um usuário consegue exportar os próprios dados e pedir a exclusão da conta sem sair do app.

### F4-21. Tela "Sobre" com os créditos obrigatórios
- [ ] Créditos TACO/Unicamp e Open Food Facts (ODbL) — exigência de licença, hoje sem tela no app
- [ ] Versão do app, link para a política de privacidade, contato

### F4-22. Preferências e aba Perfil
- [ ] A aba Perfil reúne: dados e metas, exportar e excluir conta (#33), privacidade, preferências, lembretes (Fase 6), sobre (F4-21) e ajuda
- [ ] Tema (sistema, claro, escuro)
- [ ] Ver o consentimento dado e a data

---

## Bloco G — Desempenho e eficiência

### F4-25. App leve em celular básico
- [ ] Medir no perfil de aparelho básico: tempo até a primeira tela, rolagem do diário, abertura do modal
- [ ] Listas longas (busca, histórico) com `FlatList` virtualizada
- [ ] Carregar só os pesos de fonte usados; conferir o tamanho do bundle
- [ ] Menos requisições: dia e meta reaproveitados do cache em vez de buscados de novo a cada troca de aba

---

## Bloco H — Fechamento

### 34. Validação com leitor de tela e com pessoas
**Contexto**: o TalkBack agora roda no emulador. O VoiceOver exige um iPhone físico ou um Mac (o ambiente de desenvolvimento é Windows); sem aparelho, fica registrado como pendência explícita.
- [ ] Passar o app inteiro no **TalkBack** (emulador), anotando o que falhar — incluindo a ordem de foco que a #31 só conferiu lendo o código
- [ ] **VoiceOver** num iPhone, se houver um disponível; se não, registrar como não validado
- [ ] Modal: prender o foco dentro dele e esconder a tela de trás do leitor (achado #11)
- [ ] Teste de usabilidade guiado com 3 a 5 pessoas de perfis diferentes (ex.: pessoa idosa, pessoa com baixa visão, pessoa que nunca usou app de dieta), com tarefas fixas: criar conta, registrar o almoço, registrar o peso
- [ ] Relatório visual atualizado com as telas finais

**Critério de aceite da fase**: as tarefas principais são concluídas sem ajuda por todos os perfis do teste, também com TalkBack e com fonte em 200%; nenhum par de cor abaixo de 4,5:1; e as telas de LGPD alcançáveis pelo próprio app.
