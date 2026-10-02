# Referência de telas: MyFitnessPal (2026-10-02)

Registro do vídeo de 10 minutos em que o dono do projeto percorre o MyFitnessPal (Android, conta de teste e conta própria) comentando o que quer no Gota Vital. Os quadros e a transcrição ficam **fora do repositório**, em `D:\referencias-mfp\` (o vídeo mostra e-mail, nome de usuário e peso reais). Quadros extraídos com OpenCV; narração transcrita localmente com faster-whisper (nada foi enviado a serviço externo). Os quadros selecionados, sem dados pessoais, estão na seção "Referência" do relatório visual.

O MyFitnessPal é **referência de funcionamento, não de visual nem de texto** — regra do projeto desde o início, e confirmada no vídeo: *"não é nem copiar esse aplicativo… é mais um estilo de como deve funcionar"* (00:50).

## O que o vídeo deixa claro sobre o produto

| Princípio | Trecho | Consequência |
|---|---|---|
| Fácil para qualquer pessoa | "gostaria que fosse um app um pouco mais fácil para a utilização de uma pessoa" (09:30) | Confirma a Fase 4 ampliada: simplicidade vem antes de quantidade de recursos |
| Registrar rápido | botão de microfone: "eu adiciono o que eu comi… faz uma média e já adiciona para mim no dia" (09:42) | Registro por voz com IA — ver decisões pendentes |
| Diferencial nos exames | "a ideia do nosso aplicativo é ser um pouco até melhor de estar nos exames" (05:59) | Fase 5 continua sendo o centro do produto |
| Outros países e idiomas | "a ideia também é fazer esse aplicativo que funciona em outros países, também com outras linguagens" (01:19) | Internacionalização — ver decisões pendentes |
| Preço competitivo | "a gente pode estar sendo um pouco mais competitivo aqui" (04:46), sobre o Premium | Modelo de negócio ainda não definido |
| Integrar com aparelhos | "a gente vai ter que ser compatível com todos esses aplicativos aqui" (08:21) | Health Connect / HealthKit, e smartwatch mais adiante |

A transcrição automática tem trechos duvidosos; um deles importa: em 09:36 saiu *"a ideia do meu app não é ser rápido"*, seguido do exemplo do microfone, que é justamente sobre rapidez. A leitura mais provável é "a ideia é ser fácil **e** rápido", mas fica marcado para confirmar.

## Tela a tela

Tempo do vídeo entre parênteses. "Hoje no Gota Vital" descreve o app em 2026-10-02.

### 1. Boas-vindas (00:00)
- **MyFitnessPal**: painel ilustrado com um gráfico de exemplo e a frase de valor; "Registre-se gratuitamente" e "Entrar"; versão do app no rodapé.
- **Fala**: "como se fosse um board estático, que fala sobre o app" (00:07).
- **Hoje no Gota Vital**: não existe; o app abre direto no login.
- **Proposta**: tela de boas-vindas com 2-3 painéis (diário, peso, exames), ilustrações da identidade Gota Vital. → Fase 4.

### 2. Cadastro e entrada (00:22, 02:07-04:06)
- **MyFitnessPal**: cadastro por e-mail ou "Continuar com Google"; entrada também com Facebook; "Esqueceu a senha?" com redefinição por link enviado ao e-mail.
- **Fala**: "dá para registrar pela conta que você pode criar direto no aplicativo ou pelo continuar com o Google" (00:22); recuperação de senha "é tudo um padrão de aplicativo que a gente precisa estar fazendo" (03:01).
- **Hoje no Gota Vital**: só e-mail e senha. **Não há recuperação de senha** — e há usuários reais.
- **Proposta**: recuperação de senha por e-mail é obrigatória antes de publicar (exige envio de e-mail; há serviços com nível gratuito). Login com Google é desejável e exige conta no Google Cloud e tela de consentimento. → Fase 4 (Bloco F).

### 3. Onboarding de objetivos (00:16-02:12)
- **MyFitnessPal**: barra de progresso por etapas (Metas → Plano → Você); escolha de até três metas; hábitos saudáveis em chips ("acompanhar macros", "comer mais fibras"…); frequência de planejamento de refeições; nível de atividade com exemplo de profissão em cada opção; sexo, idade, país; altura e peso com unidade ao lado; meta semanal ("perder 0,5 kg por semana", com a recomendada marcada); telas de incentivo entre as etapas.
- **Fala**: "esse aqui a gente já tem que ter planejado como a gente vai querer" (00:33); "coloca os países também" (01:13).
- **Hoje no Gota Vital**: consentimento → perfil numa tela só → peso → meta. Nível de atividade em chips sem exemplo; sem país; sem ritmo semanal.
- **Proposta**:
  - Dividir o perfil em passos curtos com barra de progresso — um assunto por tela é mais fácil para quem tem pouca familiaridade com apps.
  - Exemplo concreto em cada nível de atividade ("passa a maior parte do dia sentado — ex.: trabalho de escritório"): é a escolha que mais confunde e muda muito a meta.
  - Ritmo semanal de perda/ganho com a opção conservadora marcada; texto informativo, sem prometer resultado (RDC 657/2022).
  - País só quando houver internacionalização.
  → Fase 4.

### 4. Tela "Hoje" (04:23-05:57) — a tela principal
- **MyFitnessPal**, de cima para baixo: "Hoje ▾" abre o calendário; selo de sequência de dias registrando; faixa D-S-T-Q-Q-S-S com o dia atual marcado; card de calorias (consumidas de meta, restantes); card de carboidratos/gorduras/proteínas com botão que alterna o modo (gramas restantes, porcentagem); anúncio; "Diário" com café da manhã, almoço, jantar e lanches, cada um com "Registre"; "Hábitos saudáveis" (água, exercício, passos); "Peso" (último registro e data); "Notas" do dia. Barra inferior: Hoje · Progresso · Mais, e um botão "+" flutuante.
- **Fala**: o calendário no topo (04:33); a sequência de registros (04:36); "esse de carboidrato, gorduras e proteínas que dá para mudar esse botãozinho" (05:01); "os hábitos saudáveis de água, exercício e passos, peso e notas" (05:46); "dá para aportar uma foto" (05:57).
- **Hoje no Gota Vital**: setas ‹ › para trocar de dia, card de calorias e macros fixo em "g / meta", as quatro refeições. Sem calendário, sem faixa da semana, sem hábitos, sem peso nem notas na tela inicial.
- **Proposta** (a maior mudança de interface da fase):
  - Cabeçalho com a data tocável que abre um calendário, e faixa da semana (domingo a sábado) com marcação dos dias que têm registro.
  - Card de calorias com anel ou barra de progresso; card de macros com alternância entre "restante", "consumido" e "%", lembrando a escolha.
  - Seções na ordem: Diário → Água → Peso → Notas. Exercício e passos entram quando houver integração com aparelhos.
  - Botão "+" de registro rápido sempre visível (alimento, água, peso).
  - Sequência de dias: decidir com cuidado — motiva, mas pode gerar culpa; se entrar, com texto acolhedor.
  - Sem anúncios.
  → Fase 4 (Bloco F, item novo F4-30).

### 5. Adicionar alimento (05:12-05:41)
- **MyFitnessPal**: busca com abas (Todos, Minhas refeições, Minhas receitas, Meus alimentos); histórico dos alimentos recentes com kcal e porção e "+" para adicionar direto; leitor de código de barras (pago); "adição rápida" de calorias sem escolher alimento.
- **Fala**: "a gente teria que procurar o alimento pelo nome" (05:26); "não sei qual é a base de dados que ele usa, mas acho que é parecida com a minha" (05:38).
- **Hoje no Gota Vital**: busca por nome (TACO + Open Food Facts), sem histórico, sem kcal na lista.
- **Proposta**: histórico de recentes com adicionar em um toque — é o que mais acelera o registro do dia a dia; kcal e porção em cada resultado (já em F4-16). Código de barras continua na Fase 7 — e pode ser gratuito, um diferencial frente ao Premium deles.

### 6. Água (06:04-06:16)
- **MyFitnessPal**: estado vazio "Você bebeu água hoje?"; tela de registro com total do dia, meta diária (2.500 ml) e copos ilustrados de 250, 500 e 1.000 ml mais um valor personalizado.
- **Fala**: "a gente pode adicionar água aqui, registrar a água aqui, as imagenzinhas" (06:05).
- **Hoje no Gota Vital**: não existe.
- **Proposta**: registro de água com copos ilustrados e toque único; meta diária ajustável, sem cálculo "recomendado" que pareça prescrição. Exige tabela nova na API e entrar no export LGPD. → Fase 4 ou início da 5 (é dado novo, não só interface).

### 7. Exercício e passos (06:19-06:37)
- **MyFitnessPal**: exercício escolhe entre "cardiovascular" e "fortalecimento"; passos pedem para conectar um aparelho.
- **Fala**: "eu achei esse meio estranho… um negócio um pouco mais visual com a imagem de animações dos exercícios" (06:22); aparelhos "a gente vai estar vendo depois" (06:37).
- **Proposta**: Fase 7 (registro de treinos já estava lá). Passos e exercícios automáticos vêm do Health Connect (Android) e do HealthKit (iOS), que é por onde os smartwatches entregam os dados.

### 8. Progresso (06:40-07:21)
- **MyFitnessPal**: abas Calorias, Nutrientes, Macros por semana (navega entre semanas), com média, meta e "alimentos com mais calorias/carboidratos" (detalhe pago); exportar dados (pago); visão geral com peso e macros dos últimos 7 dias; resumo semanal em página web.
- **Fala**: "dá para exportar de alguma maneira, só que só pode ser Premium" (06:59); "você pode selecionar a data… a gente pode estar melhorando um pouco aqui" (07:07).
- **Hoje no Gota Vital**: só a aba Peso com gráfico.
- **Proposta**: aba "Progresso" reunindo peso e médias semanais de calorias e macros, com seleção de período. Exportar já é gratuito e obrigatório aqui (LGPD) — outro diferencial. Gráficos completos de macros e exames continuam na Fase 7, mas a estrutura da aba nasce na Fase 4.

### 9. Menu "Mais" / perfil (07:24-09:11)
- **MyFitnessPal**: perfil com sequência e peso perdido; Premium; jejum intermitente; sono; glicose; relatório semanal; metas (inclusive por refeição e de condicionamento); nutrição; receitas (criar com ingredientes e o app calcula as calorias); aplicativos e aparelhos conectados; comunidade e fórum; amigos; lembretes; mensagens; central de privacidade; configurações; ajuda; sincronizar.
- **Fala**: glicose "isso aqui a gente já pode adicionar, com informações que o exame da pessoa pode pôr aqui" (07:42); receitas "você adiciona os ingredientes… ele já faz todo o cálculo das calorias" (08:08); comunidade "um pouco meio não utilizada… seria para depois" (08:37-08:53); central de privacidade "todo aplicativo já tem" (09:03).
- **Proposta**:
  - Aba "Perfil" na Fase 4 com: dados e metas, exportar/excluir (#33), privacidade, preferências, lembretes, sobre, ajuda.
  - Glicose e outros marcadores alimentados pelos exames → Fase 5, e é onde o Gota Vital passa à frente.
  - Receitas com cálculo por ingrediente → Fase 7 (reaproveita a base de alimentos que já existe).
  - Jejum, sono, comunidade, amigos, mensagens → fora de escopo por ora.

## Classificação proposta

| Quando | Itens |
|---|---|
| **Fase 4 (agora)** | Tela "Hoje" nova (calendário, semana, cards, diário, peso, notas, "+"); boas-vindas; onboarding em passos com exemplos; histórico de alimentos recentes; aba Progresso (estrutura); aba Perfil; **recuperação de senha**; login com Google |
| **Fase 4 ou início da 5** | Água (dado novo na API) |
| **Fase 5** | Glicose e marcadores vindos dos exames, ligados ao Progresso |
| **Fase 6** | Lembretes por notificação; política de privacidade |
| **Fase 7** | Exercícios com animação; passos e smartwatch (Health Connect/HealthKit); código de barras; receitas; gráficos completos |
| **Fora de escopo por ora** | Comunidade, amigos, mensagens, jejum, sono, anúncios |

## Decisões pendentes (do dono do projeto)

1. **Internacionalização**: outros países mudam mais que o idioma. A base TACO é brasileira, a regra de texto informativo vem da ANVISA (RDC 657/2022), e a LGPD vira GDPR na Europa. Recomendação: na Fase 4, quando todos os textos forem revisados (F4-12), já tirá-los do código para um arquivo de traduções em pt-BR — custa pouco agora e muito depois. Traduzir e lançar fora do Brasil fica para depois da publicação.
2. **Registro por voz com IA**: cada uso tem custo de IA (mesmo portão de orçamento dos exames) e a estimativa de calorias de uma frase é aproximada — precisa de tela de revisão antes de salvar, como os exames. Recomendação: Fase 7, junto com a decisão de IA da Fase 5.
3. **Login com Google**: exige projeto no Google Cloud e tela de consentimento OAuth (gratuito). Confirmar se entra já na Fase 4.
4. **Modelo de negócio**: o vídeo menciona ser competitivo no preço do Premium. Hoje o produto é gratuito e sem anúncios; vale decidir antes da Fase 6 se haverá plano pago e o que entraria nele. Exportar dados nunca pode ser pago (LGPD).
5. **Sequência de dias** na tela inicial: motivação ou pressão? Decidir o tom.
