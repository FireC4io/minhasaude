# Plano de resposta a incidentes

Para quando houver suspeita de que alguém acessou, alterou, apagou ou vazou dados do Gota Vital (ou conseguiria). O app
guarda **dados pessoais sensíveis** (saúde): na dúvida, trate como incidente.

Exemplos: segredo exposto (chave no chat, no repositório, num print), conta de serviço invadida (GitHub, Render,
Supabase, R2, Brevo, Google Cloud, Expo, Better Stack), falha reportada pelo `SECURITY.md`, log com acesso estranho, aviso
de reuso de refresh token em massa, banco apagado ou alterado.

## 1. Conter (primeira hora)

Parar o estrago antes de entender tudo. Anotar cada passo com horário (vira o registro do item 5).

| Situação | O que fazer |
|---|---|
| Segredo da API exposto | Trocar no Render: `JWT_ACCESS_SECRET` (desloga todo mundo e invalida códigos de recuperação), `BREVO_API_KEY`, `DATABASE_URL` (trocar a senha do banco no Supabase antes) |
| Sessões suspeitas | Encerrar todas no Supabase (SQL Editor): `UPDATE refresh_tokens SET revoked_at = now() WHERE revoked_at IS NULL;` |
| Conta de serviço invadida | Trocar a senha, encerrar as sessões ativas no próprio serviço, ligar 2FA, revisar chaves/tokens criados recentemente |
| Chave do R2 ou do age exposta | Gerar chave nova no Cloudflare e trocar nos segredos do GitHub; se foi a **privada** do age, gerar par novo (`docs/security/backup.md`) e tratar as cópias antigas como expostas |
| Falha no código sendo explorada | Corrigir e dar push (deploy automático). Sem correção rápida: suspender o serviço no Render até corrigir |
| Banco apagado ou corrompido | Suspender o serviço no Render e restaurar (item 4) |

## 2. Guardar evidências

Os logs somem rápido: **Render** guarda cerca de 7 dias, **Better Stack** conforme o plano. Exportar já os trechos do
período suspeito (sem reproduzir dado de saúde em lugar nenhum fora do necessário). Anotar: o que aconteceu, quando
começou, quando foi percebido, o que foi feito.

## 3. Avaliar

- **Quais dados** (conta, perfil, medidas, diário, consentimentos, exames quando houver)?
- **De quantas pessoas**? Dá para listar quem?
- **Foi acessado, alterado, apagado ou só ficou exposto**? A cópia de segurança é cifrada: vazamento só da cópia, sem a
  chave privada do age, não expõe dados.
- **Risco para as pessoas**: dado de saúde vazado é risco relevante por natureza.

## 4. Recuperar

- Restaurar do backup se preciso: `docs/security/backup.md` → "Restaurar → De verdade".
- Confirmar que a causa foi fechada (teste de regressão no CI, como os de `apps/api/test/security-*.e2e-spec.ts`).
- Religar o serviço e conferir `/health` e o deploy-check.

## 5. Comunicar (LGPD art. 48)

Se o incidente puder trazer **risco ou dano relevante** às pessoas (com dado de saúde, presumir que sim):

- **ANPD:** comunicar em até **3 dias úteis** depois de saber que dados pessoais foram afetados, pelo formulário de
  comunicação de incidente no site da ANPD (gov.br/anpd), conforme o regulamento de comunicação de incidentes em vigor
  (Resolução CD/ANPD nº 15/2024 — conferir o texto atual na hora).
- **Pessoas afetadas:** no mesmo prazo, por e-mail (Brevo) e aviso no app, em linguagem simples: o que aconteceu, quais
  dados, o que já foi feito, o que a pessoa pode fazer (ex.: trocar senha) e o contato `euacaio14@gmail.com`.
- Se a comunicação completa não for possível no prazo, comunicar o que já se sabe e completar depois.

Mesmo sem risco relevante, **registrar** o incidente (item 6): a ANPD pode pedir o registro.

## 6. Depois

- Registro em `docs/historico/` com: linha do tempo, causa, dados e pessoas afetadas, comunicações feitas e o que mudou
  para não repetir. Guardar por pelo menos 5 anos.
- Atualizar `docs/security/avaliacao-*.md` e este plano se algo faltou.

## Contatos

- Responsável e encarregado (LGPD): Caio Cesar Martins de Lima — euacaio14@gmail.com
- Painéis: Render (serviço `minhasaude-api`), Supabase (projeto `rddxihnbtxesdiqgezcf`), Cloudflare R2, Brevo, Google
  Cloud (`gotavital`), Expo (`@caio_cesar_dev/gota-vital`), GitHub (`FireC4io/minhasaude`), Better Stack.
