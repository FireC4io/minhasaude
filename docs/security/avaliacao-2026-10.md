# Avaliação de segurança — outubro de 2026

Portão do teste fechado na Google Play (nova Fase 5). Base: OWASP API Security Top 10, ASVS, MASVS e LGPD.
Regra: cada item é verificado por **teste automatizado ou ferramenta**, nunca só por leitura de código.
Plano visual: https://claude.ai/artifact/M3cugePLkCpbjSkbVJq3BB

**Critério para começar o teste fechado**: nenhum achado crítico ou alto em aberto; médios com dono e data;
CI com análise de código e busca de segredos; build de produção analisado; política de privacidade publicada.

## Achados

| # | Gravidade | Achado | Situação | Evidência |
|---|---|---|---|---|
| 1 | Alta | Sem `trust proxy`, a API via o IP do proxy do Render em toda requisição: o limite de 5 logins/min virava um teto de todos juntos (um atacante bloqueava o login de todo mundo) e não freava força bruta por pessoa | Corrigido (`TRUST_PROXY_HOPS=1` no Render desde 10/10) | `test/security-proxy.e2e-spec.ts` |
| 2 | Alta | Textos sem tamanho máximo: senha (argon2 processa tudo o que chega), termo de busca (trigramas + repasse ao Open Food Facts), nome/marca/código de alimento, versão de política, token de renovação | Corrigido (`INPUT_LIMITS` no shared, usado pela API e pelo app) | `test/security-input-limits.e2e-spec.ts` |
| 3 | Média | Backup automático do Android ligado (padrão do Expo): a cópia local com diário, peso e metas iria para o backup na nuvem | Corrigido (`allowBackup: false`) | `apps/mobile/src/config/app-config.spec.ts` |
| 4 | Média | A cópia local de dados de saúde no celular fica no AsyncStorage, sem criptografia própria (protegida só pelo isolamento do app e pela criptografia do Android) | **Aberto** — mitigado por prazo escolhido pela pessoa (1/7/30 dias) e limpeza ao sair/apagar. Criptografar exige módulo nativo; entra com o build próprio (EAS) | — |
| 5 | Média | `decode-uri-component` 0.2.2 (via expo-router) com DoS por URL malformada; a versão corrigida é só ESM e quebraria a navegação | **Risco aceito** até o expo-router atualizar; efeito limitado a travar o próprio app | `pnpm audit` |
| 6 | Baixa | `uuid` (plugin de iOS) e `postcss-selector-parser` (Tailwind) vulneráveis, só em ferramenta de build | Risco aceito, não vão para o app nem para a API | `pnpm audit` |
| 7 | — | Os testes e2e montavam a API sem `helmet`, CORS nem proxy: testavam uma cópia parcial da configuração de produção | Corrigido para os testes novos (`configureApp`, `test/support/security-app.ts`) | — |
| 8 | Alta | Token de quem apagou a conta continuava aceito até expirar (15 min): o guard só conferia a assinatura | Corrigido: o guard confere que a conta existe e está ativa | `test/security-access.e2e-spec.ts` (conta apagada) |
| 9 | Média | LGPD: diário e metas aceitavam gravar e calcular dado de saúde sem consentimento (o app sempre pede antes, mas a API não exigia) | Corrigido: criar/alterar/calcular exige consentimento; ler, exportar e apagar o próprio dado continuam livres (direito do titular, e o app usa o 404 da meta para levar ao onboarding) | `test/security-access.e2e-spec.ts` (LGPD) |
| 10 | Baixa | Algoritmo do JWT não fixado (o `alg: none` já era recusado pela biblioteca) | Corrigido: HS256 fixo ao assinar e ao verificar | `test/security-access.e2e-spec.ts` (token forjado) |
| 11 | Baixa | O log de cada requisição grava a query string, então o termo buscado (nome de alimento) vai para o BetterStack | **Aberto**, baixo: não é identificador nem dado de exame. Rever quando os exames saírem da prévia | `api.log` |
| 12 | Alta | A conexão API → banco não configurava TLS em lugar nenhum: só seria cifrada se a `DATABASE_URL` do Render tivesse `sslmode`. Atravessa a internet (Render → Supabase em São Paulo) com senha do banco e dado de saúde | Corrigido e **no ar desde 11/10** (`DATABASE_SSL=verify-full` + CA no Render). A trava funcionou: o 1º deploy sem a variável foi recusado e o Render manteve a versão anterior | `src/config/env.schema.spec.ts`, `src/database/database-ssl.spec.ts` |
| 13 | Média | Os papéis da API REST automática do Supabase (`anon`, `authenticated`) tinham permissão em todas as tabelas, inclusive `users` e `diary_entries`; só o RLS os barrava, e tabela nova nascia aberta | Corrigido e conferido na produção (11/10): `anon`/`authenticated` sem acesso; aviso do advisor some | Migration testada no Postgres local com os papéis simulados: antes `anon` lia `users`, depois não; tabela criada depois já nasce fechada |
| 14 | Baixa | `immutable_unaccent` sem `search_path` fixo (aviso do advisor) | Corrigido na mesma migration | idem |
| 15 | Baixa | `pg_trgm` e `unaccent` no schema public (aviso do advisor) | **Risco aceito**: mover quebraria os operadores da busca, e nenhum papel não confiável cria objetos no banco | advisor do Supabase |
| 16 | Média | O plano gratuito do Supabase não tem backup recuperável | Corrigido no código: backup semanal cifrado (age, chave privada só com o dono) para bucket privado no R2; primeiro backup da produção feito e restaurado com contagem idêntica (10/10) | `.github/workflows/backup.yml`, `docs/security/backup.md`; ensaio de restauração com contagem idêntica |
| 17 | Média | Os logs de produção não chegam ao Better Stack: o código usava o endereço padrão da biblioteca, e sources novas só recebem no próprio *ingesting host*. Sem logs, um incidente não pode ser investigado | Corrigido no código (`BETTERSTACK_INGESTING_HOST`); **falta a variável no Render** | `src/config/pino-transport.spec.ts` |
| 18 | Média | LGPD: o app aceitava data de nascimento de menores de 18 (dado de saúde de criança exige consentimento dos pais) | Corrigido: regra `isAdult` no shared, recusada pela API e avisada no app | `security-access.e2e-spec.ts`, `stepped-profile-form.spec.tsx`, `age.spec.ts` |

## Verificado sem achado

- **Segredos no histórico do Git** (repositório público, 114 commits): gitleaks — só senhas falsas de teste e o valor de exemplo do `.env.example`. Nenhum `.env` real nem arquivo pessoal (PDF/imagem de exame) passou por commit. Agora roda no CI (`.github/workflows/security.yml`, `.gitleaks.toml`).
- **Dependências de produção**: nenhuma vulnerabilidade alta ou crítica. As duas altas ignoradas no `pnpm-workspace.yaml` (node-forge, braces) seguem sem correção publicada e só existem em ferramenta de desenvolvimento do Expo.
- **SQL escrito à mão na busca**: todos os valores vêm como parâmetro (`$1`…`$7`); a única interpolação é uma constante (180 dias).
- **Análise de código**: CodeQL (`security-extended`) passa a rodar a cada push e toda segunda-feira.
- **Controle de acesso** (`test/security-access.e2e-spec.ts`, 31 testes): as 19 rotas fechadas recusam quem não está logado; token sem assinatura ou com assinatura falsa é recusado; ninguém altera nem apaga alimento da TACO; ninguém anota nem vê o alimento cadastrado por outra pessoa; `userId`, `ownerUserId` e `source` no corpo são recusados; a exportação de uma pessoa não contém nada de outra. O acesso direto de B ao registro de A já estava em `foods`/`diary.e2e-spec`.
- **Logs**: requisição autenticada real — token de acesso, token de renovação e senha não aparecem nenhuma vez no log; o cabeçalho sai como `[REDACTED]`.
- **Banco**: RLS ligado nas 12 tabelas (advisor do Supabase); a API usa só conexão direta, nunca a API REST do Supabase.
- **App real**: fluxo do Maestro (criar conta → onboarding → anotar → peso → sair) passa com as regras novas.

- **Recuperar senha** (2026-10-11, `test/password-reset.e2e-spec.ts`): resposta igual para e-mail sem conta, código de uso único, 5 erros matam o código, só o mais novo vale, 3 códigos/hora por conta, 3 pedidos/min por IP; trocar a senha revoga todos os tokens de renovação. Código e senha nova fora do log (redact). Risco aceito por ora: quem sabe o e-mail de alguém pode gastar as 5 tentativas do código dela (atrapalha, não invade); se acontecer, limitar também por e-mail.

## Pendente de verificação

- Sessão: token de renovação reusado derruba a sessão
- APK de produção no MobSF
- Plano de incidente

## Reavaliação de 11/10 (ferramentas)

- **OWASP ZAP** (`zaproxy/zap-stable:2.16.1`, varredura de API pelo OpenAPI, com token, contra a API **local**):
  achou **500 em `DELETE /v1/consents/:type`** com tipo inválido (ia direto ao banco). Corrigido com `ParseEnumPipe`;
  ids de diário e alimento ganharam `ParseUUIDPipe` (mesmo problema). Regressão em
  `test/security-path-params.e2e-spec.ts`. Segunda varredura: 113 aprovadas, 0 falhas; sobra só "timestamp" no
  `/v1/auth/me` (iat/exp do próprio token, sem risco).
- **Cabeçalhos em produção** (leitura simples, sem ataque): HSTS, CSP, `nosniff`, `X-Frame-Options`,
  `Referrer-Policy: no-referrer`, sem `X-Powered-By`. OK.
- **Dependências** (`pnpm audit`): 3 moderadas, todas em ferramenta de build do app (`uuid` no plugin iOS do Expo,
  `postcss-selector-parser` no Tailwind, `decode-uri-component` no expo-router — no aparelho, só travaria o próprio app
  com link malformado). Nenhuma na API. As 2 altas ignoradas seguem justificadas em `pnpm-workspace.yaml`.
- **Trivy** (`aquasec/trivy`): descartado — a versão fixada não lê o lockfile do pnpm 12 e saía vazio sem erro;
  `pnpm audit` e gitleaks já cobrem dependências e segredos.
- **SonarQube Cloud**: workflow `sonar.yml` + `sonar-project.properties`, com a cobertura dos três pacotes
  (API 37% só de unitários — os e2e não entram na conta; app 79%; shared 81%). Liga quando houver o segredo `SONAR_TOKEN`.
- **Swagger desligado em produção** (11/10, decisão do dono): `/docs` e `/docs-json` só fora de produção (`bootstrap/swagger.ts`).
- **Resposta sem DTO** (regra do projeto): `GET /v1/consents` e `GET /v1/auth/me` devolvem objeto cru. Sem campo
  sensível hoje, mas fora do padrão.

## Passos do dono

- [x] Render → Environment: `TRUST_PROXY_HOPS=1` (feito em 10/10)
- [x] Render → Environment: `DATABASE_SSL=verify-full` e `DATABASE_SSL_CA` (11/10)
- [ ] Supabase → depois do deploy com TLS no ar: ligar *Enforce SSL*
- [x] Backup configurado e ensaiado (10/10)
- [x] Render → Environment: `BETTERSTACK_INGESTING_HOST` (11/10, região us-west-2)
- [x] SonarQube Cloud: repositório importado, análise automática desligada, segredo `SONAR_TOKEN` no GitHub (11/10)
- [ ] Guardar a chave privada do age fora deste computador
- [x] Render → Environment: conferido que `JWT_ACCESS_SECRET` é aleatório e longo, e não o `troque…` do exemplo (sondar a produção foi bloqueado, com razão, pelo modo automático)
