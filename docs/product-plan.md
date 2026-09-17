# Plano de Produto — App de Nutrição + Acompanhamento de Saúde

> Status: rascunho de planejamento (modo arquiteto). Nenhuma decisão aqui é definitiva — marcadas como "recomendado" até você confirmar.

## 1. Perguntas em aberto

**Respondidas (2026-09-17):**
1. **Orçamento**: R$0 por enquanto — decisão de liberar orçamento é futura. → hosting revisado, ver [ADR-0007](adr/0007-hosting-orcamento-zero-render-supabase-r2.md) (Railway não tem mais free tier perene; trocado por Render + Supabase + Cloudflare R2, todos gratuitos hoje).
2. **Prazo**: longo, sem deadline fixo — desenvolvedor solo ("vibecoder", uso intenso de IA no fluxo de trabalho). Roadmap sem datas continua correto, sem pressão para cortar qualidade por tempo.
3. **Usuários**: portfólio **e** usuários reais desde cedo — isso eleva a prioridade da segurança: não pode ser tratada como "depois", precisa estar na Fase 1. Ver seção 5 (segurança) e `CLAUDE.md`.
4. **Limite de uploads de exame**: confirmado — **1 exame por tipo de exame** (assumindo período de 1 mês por padrão, ajustável; não especificado se é por dia/mês, adotei mês como default conservador para custo de IA — reveja se quiser outro período). Ver regra em `docs/api-contract.md` (módulo `exams`).
5. **Nome do app**: confirmado — **"Minha Saúde"** (bate com o nome do diretório do projeto). Bundle id sugerido: `br.com.minhasaude.app` (ou domínio que vier a registrar). Antes de submeter às lojas, ainda vale checar INPI e disponibilidade exata do nome nas lojas (nome genérico — risco de nomes parecidos já existirem, ex. apps institucionais de prefeituras/planos de saúde chamados "Minha Saúde" — sugiro checar isso especificamente antes de investir em branding/ASO).

**Ainda em aberto (não bloqueantes, defaults assumidos até você corrigir):**
6. Conta Apple Developer (US$99/ano) e Google Play (US$25 único) — como orçamento é R$0 agora, isso empurra a Fase 4 para quando o orçamento abrir. Assumido como marco que depende da liberação de orçamento, não de tempo.
7. Teste fechado com usuários reais vs. só você — mantido no roadmap (Google Play exige teste fechado para conta nova).
8. Nomes de entidades/variáveis em inglês, UI em português — assumido como padrão, já aplicado em `docs/database-schema.md` e `docs/api-contract.md`.

## 2. Análise crítica da ideia

**Pontos fortes:**
- O diferencial (exames + bioimpedância) é genuinely difícil de copiar e tem valor real — a maioria dos apps de dieta BR não faz isso.
- Escopo do MVP (fases 1-4) está bem cortado: nutrição básica primeiro, exames depois. Isso é a decisão certa — exames envolvem parsing de IA, LGPD reforçada e cálculos clínicos, é muito para um MVP v1.
- Você já tem a stack backend dominada (Nest/TypeORM/PG), então o risco técnico real está concentrado em três lugares: mobile (você mesmo apontou), extração de exames por IA, e conformidade regulatória.

**Riscos e pontos fracos:**
- **Escopo do "diferencial" é o maior risco do projeto.** Bioimpedância entre aparelhos não é comparável (você já sabe disso) — isso significa que "evolução" do usuário só é confiável dentro do mesmo aparelho/fonte. Se não modelar isso desde o schema (campo de `source_device` obrigatório e non-nullable, sem "normalizar" bioimpedância entre marcas), o produto vai mentir para o usuário sobre progresso. Trate isso como requisito de dado, não só de UI.
- **Extração por IA nunca vai ser 100% confiável.** Você já previu revisão obrigatória do usuário — bom. Mas pense também em: o que acontece se o usuário confirmar um valor errado? Você está armazenando um dado de saúde incorreto que pode gerar cálculos incorretos (ex.: TFGe, HOMA-IR) e uma "conversa com seu médico" baseada em erro. Sugestão: manter o valor bruto extraído E o valor confirmado separados (nunca sobrescrever), para auditoria e para poder corrigir em massa se um parser tiver bug.
- **RDC 657/2022 (ANVISA) é uma linha tênue com os índices clínicos.** Calcular HOMA-IR, Castelli I/II, TFGe (CKD-EPI) e *mostrar resultado numérico com faixa de referência* já é uma zona cinzenta entre "informar" e "diagnosticar". Recomendo: nunca classificar o resultado com rótulos clínicos categóricos tipo "você está com pré-diabetes" — mostrar o número, a fórmula, a referência do próprio laudo, e o texto padrão de "converse com seu médico". Evite qualquer lógica de "se HOMA-IR > X, recomendamos Y" — isso é decisão de tratamento, não de informação. Trate a calculadora de índices como uma calculadora de referência pública (as fórmulas são conhecidas na literatura), não como "diagnóstico do app".
- **Open Food Facts "via importação"** é ambicioso: a base global tem milhões de produtos, boa parte lixo/incompleta para produtos BR. Importar tudo de uma vez é caro em storage/processamento e a maioria nunca vai ser buscada por um usuário brasileiro. Sugiro buscar sob demanda na API do OFF (com cache local dos itens já vistos) em vez de bulk import — ver ADR-0004.
- **Escopo "fora do MVP" está correto** ao deixar gráficos de evolução fora — mas cuidado: sem *nenhum* gráfico, nem que seja peso ao longo do tempo, o app fica difícil de demonstrar em portfólio/vídeo. Sugiro considerar um gráfico simples de peso (Fase 3, não Fase 6) como exceção de baixo custo alto valor demonstrativo.
- **Você não mencionou testes automatizados no describe do MVP.** Como é portfólio, TDD real (não só o ritual) em pelo menos auth, cálculo de metas e normalização de exames vale mais para quem for avaliar o código do que cobertura alta em CRUD trivial.
- **Nome do app**: os três primeiros candidatos que eu testaria de cabeça (Nutrium, NutriVida, Vitta) já estão em uso por apps/empresas de saúde no Brasil ou globalmente — ver seção 8.

**Simplificações sugeridas para o MVP real:**
- Não modele "múltiplos objetivos simultâneos" (perder E ganhar massa) — um objetivo ativo por vez, histórico de mudanças de objetivo.
- Cópia de refeições entre dias: implemente como "duplicar diário do dia X para o dia Y" no nível do dia inteiro primeiro; duplicar refeição individual pode vir depois — reduz a superfície de UI do MVP.
- Alimentos personalizados do usuário: no MVP, sem busca full-text compartilhada entre usuários (cada usuário só vê os próprios) — evita moderação de conteúdo e duplicidade de dados ruins na base compartilhada.

## 3. Sugestões que talvez você não tenha considerado
- **Exportação de dados em PDF/CSV** (diário alimentar, resultados de exames) — é exigência de LGPD (portabilidade) e também um ótimo diferencial de portfólio (mostra que você pensa em UX de dados, não só CRUD).
- **Modo "sem conta" / uso local antes de cadastrar** — reduz fricção de onboarding, mas adiciona complexidade de migração de dados locais → conta. Avalie se vale para o MVP (provavelmente não).
- **Catálogo de calculadoras como registro extensível** (você já pediu isso) — modele como um pacote TypeScript versionado, testado unitariamente com casos de referência da literatura (valores de exemplo dos papers originais), não como strings mágicas espalhadas pelo código. Ver ADR-0006 e `docs/database-schema.md`.
- **Idempotência e histórico imutável de cálculos**: sempre que uma fórmula mudar de versão (ex.: você descobre um erro na constante de Katch-McArdle), os valores históricos já calculados não devem mudar retroativamente — grave a versão da calculadora usada em cada resultado.

## 4. Verificação de conflitos de nome (busca web, não é parecer jurídico)

| Candidato | Situação encontrada | Recomendação |
|---|---|---|
| Nutrium | App real, líder de mercado (nutricionistas), Apple/Google Play | Evitar |
| NutriVida | Pelo menos 3 apps distintos já usam esse nome (Peru, BR, Omnilife) | Evitar |
| Vitta | Marca grande de saúde digital no Brasil (Vitta Hospital Digital) | Evitar — risco alto de confusão |
| **Saldo** / SaldoVida / MeuSaldo | Nenhum app de nutrição encontrado com esse nome; "saldo calórico" é termo natural em PT-BR | Candidato viável, mas é palavra genérica (fraca para marca registrada) |
| **NutriTrilha** | Nenhum conflito encontrado | Candidato viável |
| **Mapa Vital** | Nenhum conflito direto de app encontrado | Candidato viável, evocativo (trilha + exames) |
| **Nutrivo** | Nenhum conflito direto de app encontrado | Candidato viável, curto, pronunciável em EN/PT |

⚠️ Esta é uma checagem superficial (busca no Google + App Store + Play Store). **Antes de registrar domínio, criar conta nas lojas ou investir em marca, faça:**
- Busca no [INPI](https://busca.inpi.gov.br/pePI/) (marca registrada no Brasil).
- Busca de disponibilidade de bundle ID/nome exato na App Store Connect e Google Play Console (nomes podem estar "reservados" mesmo sem produto público).
- Checagem de domínio (.com.br / .app).

**Minha recomendação, nessa ordem:** `NutriTrilha` (comunica jornada + nutrição, sem risco óbvio) ou `Mapa Vital` (mais focado no diferencial de exames/evolução). Evitaria "Saldo" sozinho por ser genérico demais para SEO/marca, mesmo sem conflito direto.

## 5. Escopo regulatório — funcionalidades que cruzam a linha (ANVISA RDC 657/2022)

Evitar desde o design:
- Qualquer texto que classifique o usuário clinicamente ("você tem síndrome metabólica", "risco de diabetes").
- Recomendação automática de conduta ("aumente o consumo de X para baixar o colesterol") vinculada a resultado de exame.
- Alertas push com linguagem de urgência médica ("seu exame está perigoso") — usar linguagem neutra ("fora da faixa de referência do laboratório").
- Qualquer sugestão de dosagem, suplementação ou medicação.

Permitido e alinhado ao produto:
- Mostrar o valor, a unidade, a faixa de referência **do próprio laudo**, e a fórmula/fonte bibliográfica do índice calculado.
- Texto padrão fixo: "Este valor está fora da faixa de referência informada no seu laudo. Converse com um profissional de saúde." — sempre o mesmo texto, sem variação por gravidade.
