# Plano da próxima sessão (a partir de 2026-10-11) — Fase 5: Segurança e teste fechado

Objetivo da fase: começar o **teste fechado na Google Play** (12+ pessoas por 14 dias) com a avaliação de segurança
fechada. Plano visual: https://claude.ai/artifact/M3cugePLkCpbjSkbVJq3BB · Achados: `docs/security/avaliacao-2026-10.md`.

## Antes de tudo (estado em que a sessão de 10/10 terminou)

- **Commits locais não enviados** (se ainda estiverem só aqui, perguntar ao dono antes do push): `eee5a1b` (rascunho
  da política) e `0802ac1` (idade mínima 18 + `BETTERSTACK_INGESTING_HOST`). Nada quebra se a variável não existir.
- **Pendências do dono** (conferir com ele):
  - ✅ Better Stack: `BETTERSTACK_INGESTING_HOST` no Render (2026-10-11, região us-west-2, já na política).
  - Revogar a chave do Brevo que foi colada no chat; chave nova em `BREVO_API_KEY` (Render e `apps/api/.env`).
  - Supabase → ligar **Enforce SSL** (a API já conecta com TLS).
  - Guardar a chave privada do age (`D:\gotavital-backup-chave\age-chave-privada.txt`) fora do computador.
  - Apagar os secrets duplicados `BACKUP_AGE_RECIPIENT` e `BACKUP_BUCKET` (as variáveis de mesmo nome valem).
  - Reiniciar o Windows: o WMI está travado e derruba `nest start --watch` (rodar a API compilada até lá).
  - Passar o **Client ID Web** do Google (Google Auth Platform do projeto `gotavital`).

## Plano de melhorias (decidido em 2026-10-11)

Página com as 32 melhorias, as decisões do dono e o progresso: https://claude.ai/artifact/6ECBjX1NJwiLJpn2Lo8HA4
(ler a coleção `decisoes` e gravar o andamento em `progresso` com `ArtifactData`). Ordem combinada:

1. ✅ **Base** (11/10): Sonar sem falsos alarmes, lint sem aviso travado no CI, hook antes do commit, `withoutRateLimit`
   nos testes, dependências e Dependabot só com correções/menores, 7 issues fechadas, docs/ arrumada, CLAUDE.md
   com a arquitetura real, README novo. Pendentes do Dependabot: #50 (CodeQL v4 falha na análise) e #45 (Sonar action
   8.3, rebase pedido).
2. ✅ **Operação** (11/10): keep-alive a cada 10 min (API acordada + alerta por e-mail), ensaio de restauração em todo
   backup semanal (conferido na produção), `docs/release.md` com build `autoIncrement`, ZAP autenticado no CI (achou e
   corrigimos 500 com caractere nulo, `policyVersion` e `barcode` sem formato), relatório de erros do app
   (`POST /v1/client-errors` → log) e tela "Algo deu errado" no lugar da tela branca. A varredura manual da avaliação
   tinha rodado sem token de fato: ver a seção "ZAP autenticado" em `docs/security/avaliacao-2026-10.md`.
3. **App** — feitos (11/10): exportação com `customFoods` (leituras em paralelo), tela Hoje mais enxuta, `queryView`
   nas 4 telas (dado vence erro), Zod na resposta do Open Food Facts; ZAP achou XSS em JSON por nome de alimento →
   sem `<`/`>`. Medidas caseiras (11/10): 730 medidas do IBGE (POF 2008-2009) em 335 alimentos, medida criada pela pessoa, onça em inglês — `docs/dados/medidas-caseiras.md`. **Faltam:** básicos que faltam na TACO (leite de vaca líquido e todos os óleos nem entram no banco: a TACO não mediu um macro e o seed os pula; quando entrarem, dar medidas a eles em `scripts/medidas-ibge/mapping.py`), lembretes. Lista original: ajustes da tela Hoje, exportação com os alimentos da pessoa, testes das telas em erro, medidas caseiras
   (inclusive medida criada pela pessoa e unidades de outros países), básicos que faltam na TACO (ver licença da TBCA
   ou USDA), lembretes, Zod no que vem de fora.
4. **Maiores:** anotar sem internet, auditoria no banco, quebrar as telas complexas, juntar telas repetidas, consultas
   em paralelo, limpeza de estilo do Sonar.

Depois: TalkBack real (#34), revisão das traduções (o dono vai achar usuários em inglês e espanhol), sequência de dias
(consultar o público), Play Integrity. Aba Exames fica como está.

## Ordem sugerida

1. ✅ **Recuperar senha (API + tela)** — feito e testado em produção em 2026-10-11 (código de 6 dígitos por e-mail, Brevo
   configurado no Render; e-mail chegou e a troca funcionou no emulador).
2. ✅ **Login com Google** — feito e testado em 2026-10-11 no APK do EAS (`preview`) contra produção. Configurado: Client ID Web
   (`637195029476-pfdh…`) em `GOOGLE_WEB_CLIENT_ID` (Render) e no `eas.json`; cliente Android `br.com.gotavital` com a SHA-1 da
   chave do EAS (`637195029476-j8to…`). Falta: segundo cliente Android com a SHA-1 da Play App Signing quando subir na Play;
   iOS (cliente próprio + `iosUrlScheme` no plugin). O primeiro build EAS também saiu (precisou compilar o shared no
   `eas-build-post-install`).
3. ✅ **Publicar a política** — 2026-10-11: https://firec4io.github.io/minhasaude/privacidade/ (workflow `privacy-page.yml`
   gera a página de `docs/legal/politica-de-privacidade.md` a cada mudança). Versão `2026-10`; quem aceitou a antiga
   cai na tela `policy-update` (pode baixar dados, apagar a conta ou sair sem aceitar). Usar esse endereço na Play Console.
   ✅ `GET /v1/consents` com DTO (11/10).
4. ✅ **Criptografia da cópia local** (achado 4) — 2026-10-11, `apps/mobile/src/api/encrypted-storage.ts`. Conferido pelo
   dono no APK do EAS: abre offline com a cópia. O teste achou um bug antigo (corrigido em `162fab3`): sem internet, a
   atualização falhava e o guard raiz/telas mostravam erro mesmo com a cópia em mãos. MobSF feito (11/10): triagem em
   `docs/security/avaliacao-2026-10.md`; câmera/arquivos/áudio bloqueados até sair da prévia.
5. ✅ **Itens restantes da avaliação** — cabeçalhos conferidos, Swagger desligado em produção, plano de incidente,
   reuso de token derruba a sessão (todos em 11/10) e rotas sem DTO (`/consents`, `/auth/me`). Fica para depois:
   auditoria no banco, ZAP no CI, extensões fora do `public`, Play Integrity.
6. ✅ **Loja** (11/10) — textos e respostas em `docs/loja/play-console.md` (ficha, segurança dos dados, app de saúde,
   conteúdo do app); imagens em `apps/mobile/store/play/` (7 capturas, recurso gráfico, ícone). Página pública
   para apagar a conta sem o app: https://firec4io.github.io/minhasaude/excluir-conta/ (exigência da Play).
   As capturas acharam e corrigiram: boas-vindas prometendo exames/voz no build de produção, busca ("frango" trazia
   pão francês; frutas vinham como suco/polpa/doce) e troca de idioma que só valia ao reabrir o app.
   **Falta (dono):** conta de revisão na produção, segundo cliente OAuth com a SHA-1 da Play App Signing, build
   `production` (AAB) e preencher a Play Console com o documento — checklist na seção 6 dele.
7. **Teste fechado**: o dono lista 12–15 testadores (de preferência dos perfis da Fase 4).

Depois (Fase 6, durante os 14 dias): decidir a IA de leitura de exames, tirar exames/voz/água/notas da prévia,
unidades de laboratório faladas por extenso.

Planos anteriores: `docs/historico/plano-2026-10-07.md`.
