# Plano da próxima sessão (a partir de 2026-10-12) — Fase 5: Segurança e teste fechado

Objetivo da fase: começar o **teste fechado na Google Play** (12+ pessoas por 14 dias). Plano visual da fase:
https://claude.ai/artifact/M3cugePLkCpbjSkbVJq3BB · Melhorias e decisões: https://claude.ai/artifact/6ECBjX1NJwiLJpn2Lo8HA4
(coleções `decisoes` e `progresso` no `ArtifactData`) · Mapa do projeto: https://claude.ai/artifact/Vv6w88xd6oJn3Rwu2RqdBe

## Primeiro: conferir o build no celular

Build EAS `preview` (APK) gerado no fim de 2026-10-11, já com tudo o que está em `main` (`98f7d7d`):
https://expo.dev/accounts/caio_cesar_dev/projects/gota-vital/builds/ac6d3787-2413-4ebd-ac6c-789cae8e1abb

Roteiro com o dono:
1. Busca: "leite" traz leite de vaca integral primeiro; "macarrão" traz macarrão cozido; "azeite" traz o azeite.
   Itens do USDA mostram "dados do USDA (EUA)"; tela Sobre tem os créditos de USDA e IBGE.
2. Medidas caseiras: anotar "2 colheres de sopa" de arroz (deve dar 50 g, 64 kcal); criar "minha caneca"; apagar e
   ver a anotação virar gramas.
3. Lembretes (Perfil → Lembretes): ligar (pede permissão), "Testar lembrete", tocar na notificação, botões
   "Anotar agora" e "Lembrar em 30 min", "só se eu ainda não anotei" (anotar o almoço e ver o lembrete sumir),
   som/vibrar/silêncio, mensagem discreta, logout apaga tudo. **Nunca foi visto num celular**: é o maior risco.
4. Corrigir o que aparecer antes de seguir.

## Pendências do dono

- Revogar a chave do Brevo que foi colada no chat; chave nova em `BREVO_API_KEY` (Render e `apps/api/.env`).
- Supabase → ligar **Enforce SSL** (a API já conecta com TLS).
- Guardar a chave privada do age (`D:\gotavital-backup-chave\age-chave-privada.txt`) fora do computador.
- Apagar os secrets duplicados `BACKUP_AGE_RECIPIENT` e `BACKUP_BUCKET` no GitHub.
- Loja: conta de revisão, segundo cliente OAuth (Play App Signing) e AAB no teste interno **feitos em 2026-10-12**.
  As 10 declarações de Conteúdo do app foram enviadas em 2026-10-12 (respostas em `docs/loja/play-console.md`).
  Falta: ficha da loja (textos e imagens), roteiro do APK no celular, lista de testadores e promover ao teste fechado.
- Melhoria anotada: bloquear no `app.json` permissões que entram pelas bibliotecas e o app não usa (`c2dm` de push
  remoto, contadores de ícone dos fabricantes, biometria, install referrer). Não bloqueia a publicação.
- Listar 12–15 testadores (de preferência dos perfis da Fase 4; incluir quem use leitor de tela e quem fale inglês ou
  espanhol).

## Bloco 4 — Maiores (concluído em 2026-10-12)

Na ordem sugerida:
1. ~~**Anotar sem internet**~~ — feito em 2026-10-12 (regra no CLAUDE.md, código em
   `apps/mobile/src/features/offline-queue/`). Testado na web com o modo sem internet do Playwright; **falta ver no
   celular** (modo avião → anotar → religar). Editar e apagar sem internet ficaram de fora (ainda exigem conexão).
2. ~~**Auditoria no banco**~~ — feito em 2026-10-12: `audit_events` (só acréscimo, com RLS), registra exportar,
   revogar consentimento, pedir exclusão e exclusão concluída; entra no export. A linha "Histórico dos seus pedidos" da política foi tratada como esclarecimento da
   versão 2026-10 (decisão do dono, 2026-10-12): sem novo aceite.
3. ~~**Quebrar as telas complexas**~~ — feito em 2026-10-12: `diary-entry.tsx` 315→155, Hoje 251→143, Envio de
   exame 192→90 linhas; as três ganharam teste de tela antes da quebra.
4. ~~**Juntar telas repetidas**~~ — feito em 2026-10-12: `FileActionScreen` (Exportação e Relatório) e
   `NewPasswordField` (Cadastro e Nova senha). A lista do que vai na exportação passou a citar alimentos próprios e
   histórico de pedidos.
5. ~~**Consultas em paralelo**~~ — feito em 2026-10-12: consentimentos numa consulta só, cópia do dia, cache do
   Open Food Facts, relatório, agenda de lembretes e voz em paralelo. Ficam em sequência de propósito: fila sem
   internet (ordem), exclusão de contas (uma falha não para as outras), gravação da cópia do dia (ordem).
6. ~~**Limpeza de estilo do Sonar**~~ — feito em 2026-10-12: 64 props `Readonly` (S6759) e 17 ternários
   encadeados (S3358, com `QueryStateView` para carregando/erro/dado). Ficam abertos de propósito: `await` em laço
   em migrations/seeds/fila (S9382) e 4 avisos de caminho em `scripts/medidas-ibge/*.py` (scripts locais, sem
   entrada de terceiros) — marcar como "não se aplica" no SonarCloud (precisa do login do dono).

## Depois

- TalkBack real (#34) durante o teste fechado.
- Revisão do inglês e do espanhol por quem fala a língua (agora inclui as frases dos lembretes e os nomes das medidas).
- Sequência de dias anotando: consultar o público antes.
- Play Integrity (Fase 7).
- Fase 6 (durante os 14 dias do teste): decidir a IA de leitura de exames; ela e o R2 nascem com **porta e adaptador**
  (decisão de 2026-10-11: o resto continua em camadas simples); tirar exames/voz/água/notas da prévia.

## O que foi feito em 2026-10-12 (bloco 4 concluído)

- Os seis itens do bloco 4 (acima, riscados). Commits `3e31328` a `d2f05e9`, todos em produção.
- Visto no emulador (Expo Go): anotar sem internet, fila sobrevivendo ao app fechado, envio sozinho ao voltar.
- Correções achadas no caminho: tela Hoje quebrava na web (lembretes); app não abria no Expo Go (expo-notifications
  agora só carrega no app instalado); a cópia no aparelho perdia o dia depois de falhar sem internet.
- **O APK `preview` de 2026-10-11 ficou para trás**: gerar outro antes do roteiro no celular (inclui agora: modo
  avião → anotar → religar).

## O que foi feito em 2026-10-11 (bloco 3 concluído)

- Medidas caseiras: 742 do IBGE (POF 2008-2009) em 341 alimentos da TACO, medida criada pela pessoa, onça em inglês —
  `docs/dados/medidas-caseiras.md`.
- Básicos que faltavam: 130 alimentos do USDA (CC0; TBCA exige licença paga) com 121 medidas, lista aprovada pelo dono
  em https://claude.ai/artifact/JfWsHhmS2xZjBNYx3iHz27; óleos e azeites da TACO com proteína e carboidrato zero —
  `docs/dados/alimentos-usda.md`. Migrations rodam uma por transação (`migrationsTransactionMode: 'each'`).
- Lembretes de anotar (notificação local) — regra no CLAUDE.md, código em `apps/mobile/src/features/reminders/`.
- Antes disso, no mesmo dia: blocos 1 (base) e 2 (operação) e o começo do 3. Plano anterior completo:
  `docs/historico/plano-2026-10-11.md`.
