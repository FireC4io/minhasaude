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
- Loja (checklist na seção 6 de `docs/loja/play-console.md`): conta de revisão na produção, segundo cliente OAuth
  Android com a SHA-1 da Play App Signing, build `production` (AAB), preencher a Play Console.
- Listar 12–15 testadores (de preferência dos perfis da Fase 4; incluir quem use leitor de tela e quem fale inglês ou
  espanhol).

## Bloco 4 — Maiores (próximo trabalho de código)

Na ordem sugerida:
1. **Anotar sem internet**: fila no aparelho que envia sozinha quando a conexão volta (diário e peso). Hoje o app
   mostra a cópia sem internet, mas anotar falha. É o que mais pesa para o público com internet ruim.
2. **Auditoria no banco**: quem fez o quê nas ações sensíveis (apagar conta, exportar, revogar consentimento).
   Tabela nova entra na lista de RLS.
3. **Quebrar as telas complexas**: `diary-entry.tsx` (~300 linhas), Hoje e Envio de exame.
4. **Juntar telas repetidas**: Relatório com Exportação, Cadastro com Nova senha.
5. **Consultas em paralelo** onde der (21 trechos com `await` em laço; consentimentos fazem 3 seguidas).
6. **Limpeza de estilo do Sonar** (propriedades só leitura, condições encadeadas).

## Depois

- TalkBack real (#34) durante o teste fechado.
- Revisão do inglês e do espanhol por quem fala a língua (agora inclui as frases dos lembretes e os nomes das medidas).
- Sequência de dias anotando: consultar o público antes.
- Play Integrity (Fase 7).
- Fase 6 (durante os 14 dias do teste): decidir a IA de leitura de exames; ela e o R2 nascem com **porta e adaptador**
  (decisão de 2026-10-11: o resto continua em camadas simples); tirar exames/voz/água/notas da prévia.

## O que foi feito em 2026-10-11 (bloco 3 concluído)

- Medidas caseiras: 742 do IBGE (POF 2008-2009) em 341 alimentos da TACO, medida criada pela pessoa, onça em inglês —
  `docs/dados/medidas-caseiras.md`.
- Básicos que faltavam: 130 alimentos do USDA (CC0; TBCA exige licença paga) com 121 medidas, lista aprovada pelo dono
  em https://claude.ai/artifact/JfWsHhmS2xZjBNYx3iHz27; óleos e azeites da TACO com proteína e carboidrato zero —
  `docs/dados/alimentos-usda.md`. Migrations rodam uma por transação (`migrationsTransactionMode: 'each'`).
- Lembretes de anotar (notificação local) — regra no CLAUDE.md, código em `apps/mobile/src/features/reminders/`.
- Antes disso, no mesmo dia: blocos 1 (base) e 2 (operação) e o começo do 3. Plano anterior completo:
  `docs/historico/plano-2026-10-11.md`.
