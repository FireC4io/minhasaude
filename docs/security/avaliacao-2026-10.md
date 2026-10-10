# Avaliação de segurança — outubro de 2026

Portão do teste fechado na Google Play (nova Fase 5). Base: OWASP API Security Top 10, ASVS, MASVS e LGPD.
Regra: cada item é verificado por **teste automatizado ou ferramenta**, nunca só por leitura de código.
Plano visual: https://claude.ai/artifact/M3cugePLkCpbjSkbVJq3BB

**Critério para começar o teste fechado**: nenhum achado crítico ou alto em aberto; médios com dono e data;
CI com análise de código e busca de segredos; build de produção analisado; política de privacidade publicada.

## Achados

| # | Gravidade | Achado | Situação | Evidência |
|---|---|---|---|---|
| 1 | Alta | Sem `trust proxy`, a API via o IP do proxy do Render em toda requisição: o limite de 5 logins/min virava um teto de todos juntos (um atacante bloqueava o login de todo mundo) e não freava força bruta por pessoa | Corrigido no código; **falta `TRUST_PROXY_HOPS=1` no Render** | `test/security-proxy.e2e-spec.ts` |
| 2 | Alta | Textos sem tamanho máximo: senha (argon2 processa tudo o que chega), termo de busca (trigramas + repasse ao Open Food Facts), nome/marca/código de alimento, versão de política, token de renovação | Corrigido (`INPUT_LIMITS` no shared, usado pela API e pelo app) | `test/security-input-limits.e2e-spec.ts` |
| 3 | Média | Backup automático do Android ligado (padrão do Expo): a cópia local com diário, peso e metas iria para o backup na nuvem | Corrigido (`allowBackup: false`) | `apps/mobile/src/config/app-config.spec.ts` |
| 4 | Média | A cópia local de dados de saúde no celular fica no AsyncStorage, sem criptografia própria (protegida só pelo isolamento do app e pela criptografia do Android) | **Aberto** — mitigado por prazo escolhido pela pessoa (1/7/30 dias) e limpeza ao sair/apagar. Criptografar exige módulo nativo; entra com o build próprio (EAS) | — |
| 5 | Média | `decode-uri-component` 0.2.2 (via expo-router) com DoS por URL malformada; a versão corrigida é só ESM e quebraria a navegação | **Risco aceito** até o expo-router atualizar; efeito limitado a travar o próprio app | `pnpm audit` |
| 6 | Baixa | `uuid` (plugin de iOS) e `postcss-selector-parser` (Tailwind) vulneráveis, só em ferramenta de build | Risco aceito, não vão para o app nem para a API | `pnpm audit` |
| 8 | Alta | Token de quem apagou a conta continuava aceito até expirar (15 min): o guard só conferia a assinatura | Corrigido: o guard confere que a conta existe e está ativa | `test/security-access.e2e-spec.ts` (conta apagada) |
| 9 | Média | LGPD: diário e metas aceitavam gravar e calcular dado de saúde sem consentimento (o app sempre pede antes, mas a API não exigia) | Corrigido: criar/alterar/calcular exige consentimento; ler, exportar e apagar o próprio dado continuam livres (direito do titular, e o app usa o 404 da meta para levar ao onboarding) | `test/security-access.e2e-spec.ts` (LGPD) |
| 10 | Baixa | Algoritmo do JWT não fixado (o `alg: none` já era recusado pela biblioteca) | Corrigido: HS256 fixo ao assinar e ao verificar | `test/security-access.e2e-spec.ts` (token forjado) |
| 11 | Baixa | O log de cada requisição grava a query string, então o termo buscado (nome de alimento) vai para o BetterStack | **Aberto**, baixo: não é identificador nem dado de exame. Rever quando os exames saírem da prévia | `api.log` |
| 7 | — | Os testes e2e montavam a API sem `helmet`, CORS nem proxy: testavam uma cópia parcial da configuração de produção | Corrigido para os testes novos (`configureApp`, `test/support/security-app.ts`) | — |

## Verificado sem achado

- **Segredos no histórico do Git** (repositório público, 114 commits): gitleaks — só senhas falsas de teste e o valor de exemplo do `.env.example`. Nenhum `.env` real nem arquivo pessoal (PDF/imagem de exame) passou por commit. Agora roda no CI (`.github/workflows/security.yml`, `.gitleaks.toml`).
- **Dependências de produção**: nenhuma vulnerabilidade alta ou crítica. As duas altas ignoradas no `pnpm-workspace.yaml` (node-forge, braces) seguem sem correção publicada e só existem em ferramenta de desenvolvimento do Expo.
- **SQL escrito à mão na busca**: todos os valores vêm como parâmetro (`$1`…`$7`); a única interpolação é uma constante (180 dias).
- **Análise de código**: CodeQL (`security-extended`) passa a rodar a cada push e toda segunda-feira.

- **Controle de acesso** (`test/security-access.e2e-spec.ts`, 31 testes): as 19 rotas fechadas recusam quem não está logado; token sem assinatura ou com assinatura falsa é recusado; ninguém altera nem apaga alimento da TACO; ninguém anota nem vê o alimento cadastrado por outra pessoa; `userId`, `ownerUserId` e `source` no corpo são recusados; a exportação de uma pessoa não contém nada de outra. O acesso direto de B ao registro de A já estava em `foods`/`diary.e2e-spec`.
- **Logs**: requisição autenticada real — token de acesso, token de renovação e senha não aparecem nenhuma vez no log; o cabeçalho sai como `[REDACTED]`.
- **App real**: fluxo do Maestro (criar conta → onboarding → anotar → peso → sair) passa com as regras novas.

## Pendente de verificação

- Sessão: token de renovação reusado derruba a sessão; trocar senha invalida tudo (junto com recuperar senha)
- Recuperar senha e login com Google (novos)
- Logs reais sem dado sensível; cabeçalhos; Swagger público em produção
- Banco: RLS, TLS, 2 avisos do Supabase, backup e restauração
- APK de produção no MobSF
- Política de privacidade e plano de incidente

## Passos do dono

- [x] Render → Environment: `TRUST_PROXY_HOPS=1` (feito em 10/10)
- [x] Render → Environment: conferido que `JWT_ACCESS_SECRET` é aleatório e longo, e não o `troque…` do exemplo (sondar a produção foi bloqueado, com razão, pelo modo automático)
