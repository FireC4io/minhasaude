# Google Play Console: ficha e formulários

Respostas prontas para copiar na Play Console, conferidas contra o código em 2026-10-11. **Se o app passar a guardar
um dado novo ou a usar um serviço novo, este arquivo e a política (`docs/legal/`) mudam juntos.** Os exames ainda estão
em prévia e fora do build de produção: nada aqui fala deles. Quando saírem da prévia (Fase 6), revisar a segurança de
dados (fotos e PDFs, IA de leitura) e a declaração de app de saúde.

Links fixos:

- Política de privacidade: https://firec4io.github.io/minhasaude/privacidade/
- Apagar a conta sem o app: https://firec4io.github.io/minhasaude/excluir-conta/
- E-mail de contato: euacaio14@gmail.com

## 1. Ficha principal (pt-BR)

**Nome do app** (até 30 caracteres): `Gota Vital: comida e peso` (25)

**Descrição curta** (até 80): `Anote o que come e acompanhe calorias, nutrientes e peso. Sem anúncios.` (72)

**Descrição completa** (até 4000):

```text
O Gota Vital ajuda você a anotar o que come e a acompanhar seu peso, de um jeito simples.

ANOTE SUAS REFEIÇÕES
• Busque alimentos na Tabela Brasileira de Composição de Alimentos (TACO), com nomes que a gente usa no dia a dia, como aipim, macaxeira e pão de sal.
• Não achou? A busca também procura no Open Food Facts, ou você cadastra o seu alimento.
• Veja calorias, proteínas, carboidratos, gorduras, fibras e outros nutrientes de cada refeição e do dia.

SAIBA QUANTO FALTA PARA A SUA META
• O app estima uma meta diária de calorias e nutrientes a partir do seu perfil, com fórmulas usadas em nutrição.
• Escolha se quer perder, manter ou ganhar peso, e em que ritmo.

ACOMPANHE SEU PESO
• Anote seu peso e veja a evolução em um gráfico.
• Gere um relatório do seu progresso em PDF para guardar ou mostrar a um profissional.

FEITO PARA TODO MUNDO
• Letras grandes, modo escuro e compatível com leitor de tela.
• Funciona em celulares simples e mostra o que você já viu mesmo sem internet.
• Em português, inglês e espanhol.

SEUS DADOS SÃO SEUS
• Sem anúncios e sem venda de dados.
• Baixe tudo o que o app guarda sobre você, ou apague sua conta na hora, direto no app.
• Dados guardados no Brasil, com conexão sempre cifrada.

O Gota Vital é informativo: as metas são estimativas e não substituem a orientação de um profissional de saúde. O app não faz diagnóstico nem indica tratamento. Para pessoas a partir de 18 anos.

Dados de alimentos: Tabela Brasileira de Composição de Alimentos (TACO, NEPA/Unicamp) e Open Food Facts (licença ODbL).
```

Revisar antes de colar: nada aqui promete resultado de peso nem fala de exames (proibido pela Play em app de saúde
sem comprovação, e a RDC 657/2022 do projeto). Fórmulas e ritmos citados batem com `packages/shared/src/calculators/`.

**Categoria:** Saúde e fitness · **Tags:** dieta e nutrição, perda de peso, contador de calorias (escolher as que a
Play oferecer próximas disso) · **E-mail:** euacaio14@gmail.com · **Site:** deixar vazio ou o link da política.

Inglês e espanhol: traduzir esta ficha só quando a revisão por falante nativo das traduções do app acontecer
(pendência registrada no plano). Até lá, ficha só em pt-BR.

## 2. Conteúdo do app (Política do app)

| Seção | Resposta |
|---|---|
| Política de privacidade | Link acima |
| Acesso ao app | "Todas ou algumas funcionalidades são restritas": login obrigatório. **Criar uma conta de revisão na produção** com dados de exemplo (perfil, alguns dias de diário e de peso) e informar e-mail + senha. Não usar conta pessoal |
| Anúncios | Não contém anúncios |
| Classificação de conteúdo | Questionário IARC, categoria "Utilidade, produtividade, comunicação ou outro": sem violência, sexo, linguagem imprópria, drogas, apostas; sem interação entre usuários; não compartilha localização; sem compras digitais (por enquanto). Resultado esperado: Livre |
| Público-alvo | 18 anos ou mais (`isAdult` no shared). Não atrai crianças |
| Apps de notícias | Não |
| Apps governamentais | Não |
| Recursos financeiros | Nenhum |
| Saúde | Ver seção 4 |
| Segurança dos dados | Ver seção 3 |
| Exclusão de conta | Link "Apagar a conta sem o app" acima |

## 3. Segurança dos dados

**Visão geral**

| Pergunta | Resposta |
|---|---|
| O app coleta ou compartilha algum dos tipos de dados exigidos? | Sim |
| Todos os dados são criptografados em trânsito? | Sim (HTTPS na API, TLS até o banco) |
| Oferece uma forma de pedir a exclusão dos dados? | Sim: no app (Perfil → Apagar minha conta) e pelo link da web |
| Conta criada no app? | Sim, com e-mail e senha ou login com o Google. Link de exclusão: o de cima |

**Compartilhamento:** marcar que **não compartilha**. Supabase, Render, Cloudflare, Better Stack, Brevo e Google são
prestadores de serviço agindo em nome do app, o que a Play não conta como compartilhamento. O Open Food Facts recebe
só o termo buscado, sem nada que identifique a pessoa.

**Coleta** (todos: coletados, **não** processados de forma temporária, sem compartilhamento):

| Tipo na Play | O que é no app | Obrigatório? | Finalidades |
|---|---|---|---|
| Informações pessoais → Endereço de e-mail | E-mail da conta | Obrigatório | Funcionalidade do app; Gerenciamento da conta |
| Informações pessoais → IDs de usuário | Identificador da conta Google, se a pessoa entrar com o Google | Opcional | Funcionalidade do app; Gerenciamento da conta |
| Informações pessoais → Outras informações | Data de nascimento e sexo (cálculo da meta) | Obrigatório | Funcionalidade do app |
| Saúde e fitness → Informações de saúde | Peso, altura, diário alimentar, metas calculadas, alimentos cadastrados | Obrigatório | Funcionalidade do app |
| Saúde e fitness → Informações de condicionamento físico | Nível de atividade física e objetivo | Obrigatório | Funcionalidade do app |
| Informações e desempenho do app → Outros dados de desempenho | Registros técnicos de cada requisição (rota, resultado, IP), sem dado de saúde | Obrigatório | Prevenção contra fraudes, segurança e conformidade |
| Informações e desempenho do app → Registros de falhas | Quando o app dá erro: mensagem técnica, tela e versão do app (`POST /v1/client-errors`, só no log, sem dado de saúde) | Obrigatório | Análise |

**Não coletados:** localização, contatos, fotos e vídeos, áudio, arquivos, agenda, mensagens, navegação na web,
compras, informações financeiras, identificadores do aparelho, histórico de apps.

Conferir contra `docs/legal/politica-de-privacidade.md` seção 2 antes de enviar: as duas listas precisam bater.

## 4. Declaração de app de saúde

| Pergunta | Resposta |
|---|---|
| Recursos de saúde | Nutrição e controle de peso (diário alimentar, metas de calorias e nutrientes, registro de peso) |
| É um dispositivo médico / faz diagnóstico, tratamento ou prevenção de doença? | Não. Metas e índices são estimativas informativas (texto no app e na ficha) |
| Usa o Health Connect? | Não |
| Precisa de aprovação regulatória (Anvisa)? | Não: não é software como dispositivo médico (RDC 657/2022) enquanto não fizer diagnóstico nem recomendar tratamento |
| Pesquisa em seres humanos? | Não |

## 5. Materiais gráficos

Gerados em `apps/mobile/store/play/` (ver `apps/mobile/store/README.md`). Regras da Play: ícone 512×512 PNG (até 1 MB), recurso gráfico
1024×500 PNG/JPG sem transparência, de 2 a 8 capturas de celular (aqui 1080×1920). Sem tela em prévia, sem e-mail de
teste visível, sem texto que prometa resultado.

## 6. Antes de enviar para o teste fechado

- [x] Conta de revisão criada na produção, com dados de exemplo (2026-10-12; e-mail e senha com o dono, vão em
      Conteúdo do app → Acesso ao app)
- [x] Segundo cliente OAuth Android com a SHA-1 da **Play App Signing** (2026-10-12, cliente "Gota Vital — Play" no
      projeto `gotavital`; login com Google testado no app instalado pela Play)
- [x] Build `production` do EAS em AAB (build 2, versão 1.0.0, na trilha de teste interno)

**Chaves de assinatura** (impressões digitais são públicas):

| Chave | SHA-1 | Cliente OAuth Android |
|---|---|---|
| Upload (EAS; assina o APK `preview`) | `33:48:C4:BA:76:96:E7:64:7E:9E:B6:F8:3A:F4:19:22:95:6A:4B:CA` | o primeiro (`637195029476-j8to…`) |
| Assinatura do app (Google; assina o que sai da Play) | `14:45:87:08:AA:0F:BE:50:64:90:2B:37:4A:02:15:FA:61:1F:65:C5` | "Gota Vital — Play" |

Na Play Console de 2026 a página "Integridade do app" virou **Protegido com o Google Play → Proteção da Play Store →
Proteger chave de assinatura do app**, e ela pode mostrar só a chave de upload. Caminho que sempre funciona: **Explorador
de pacotes de apps → versão → Downloads → APK universal assinado** e ler a assinatura com
`apksigner verify --print-certs` (Android SDK, `build-tools`).
- [ ] Lista de 12–15 testadores (e-mails de contas Google)
