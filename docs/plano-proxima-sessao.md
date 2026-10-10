# Plano da próxima sessão (a partir de 2026-10-07)

Contexto completo: `docs/noite-2026-10-06.md` (o que foi feito, decisões, achados) e o quadro de status no
topo do Bloco B em `docs/backlog-fase4.md`. Toda mudança de backend vai para produção no push (Render):
migrations com cuidado, testes antes, e avisar o dono antes de publicar mudança de banco.

## Ordem sugerida

### 1. ✅ Exclusão de conta permanente (2026-10-07, `0df0109`)
- Feito: exclusão **na hora** (decisão do dono). O login já recusava `PENDING_DELETION` — a "lacuna" anotada
  estava errada. O job diário ficou só como rede de segurança se o purge falhar no meio.

<details><summary>Plano original</summary>

- Login recusa conta em `PENDING_DELETION` (ou exclusão imediata, sem prazo — confirmar qual no início).
- Antes de confirmar, a tela mostra o que será apagado e oferece **baixar o relatório de progresso**.
- Testes unitários + e2e; conferir que o `ON DELETE CASCADE` cobre tudo.

</details>

### 2. ✅ Relatório de progresso (2026-10-07, `6c3b84a`)
- Feito: PDF gerado no aparelho (`expo-print`) com peso, médias semanais vs. meta, metas e diário completo;
  `GET /v1/me/progress-report`; Perfil → Relatório de progresso e na tela de exclusão. Export LGPD: **o dono
  deixou para discutir depois** (alimentos cadastrados seguem fora).
- Falta: validar o PDF num aparelho real (no navegador, renderizado com Edge headless e conferido).

<details><summary>Plano original</summary>

- Definir com o dono o conteúdo (peso, médias, metas, diário; exames quando existirem) e o formato
  (PDF legível é o mais provável). Reaproveitar na exclusão de conta e no Perfil.
- Junto: discutir o conteúdo exato da exportação LGPD (incluir alimentos cadastrados pela pessoa).

</details>

### 3. ✅ Busca de alimento por relevância (2026-10-07)
- Feito: ordem em camadas (hábito da pessoa nos últimos 180 dias → forma padrão → nome-base igual ao termo →
  nome-base + demais palavras → começa com o termo → cita o termo → similaridade; cozido antes de cru, nome curto
  antes de longo) e sinônimos regionais (aipim/macaxeira, pão de sal, cacetinho, jerimum). Código em
  `apps/api/src/foods/search/`; formas padrão em `PREFERRED_FOODS` (teste confere cada nome contra o CSV da TACO).
- Achado: a TACO importada não tem leite de vaca fluido (só em pó), então "leite" traz "Leite, de coco" primeiro.

<details><summary>Plano original</summary>

- Ordenar: começa com o termo → contém o termo → similaridade `pg_trgm`; forma comum (cozido) e nome curto
  antes de prato composto; alimentos mais registrados pela pessoa primeiro; sinônimos simples.
- Testes com casos reais: "arroz", "feijão", "pão", "banana".

</details>

### 4. Login com Google — prioridade de comodidade
- **Passo do dono**: criar projeto no Google Cloud e a tela de consentimento OAuth (gratuito).
- Backend: endpoint que valida o token do Google e cria/vincula a conta; app: `expo-auth-session`.
- Recuperar senha por e-mail na mesma leva (a tela já existe em prévia): escolher serviço de e-mail com nível
  gratuito.

### 5. ✅ Tempo da cópia no celular escolhido pela pessoa (2026-10-07, `7685145`)
- Perfil → Preferências: 1, 7 ou 30 dias (máximo 30). Hoje é fixo em 24 h (`PERSIST_MAX_AGE_MS`).

### 6. ✅ Ritmo semanal no onboarding (2026-10-07, `656148c`, em produção)
- Feito: 0,25 / 0,5 / 0,75 kg por semana (mais leve marcada), calculadora de meta 2.0.0 com trava na TMB,
  `calculator_version` gravado na meta. Conferido em produção.

<details><summary>Plano original</summary>

#### Ritmo semanal no onboarding
- Opções 0,25 / 0,5 / 0,75 kg por semana, conservadora marcada, texto sem promessa (RDC 657/2022).
- Precisa de campo novo na meta (API + migration + calculadora com `calculator_version`).

</details>

### 7. ✅ Micronutrientes (2026-10-07, `5eb2a41`, em produção)
- Expor fibras, sódio, cálcio, ferro e vitaminas da TACO (`fiberGPer100g` já existe no banco). Mostrar na
  busca, na conta da quantidade e no resumo do dia.

### 8. ✅ Textos e idiomas (2026-10-07)
- Feito: i18next com pt-BR como fonte (`apps/mobile/src/i18n/locales/pt-BR.ts`); `en.ts`/`es.ts` tipados a partir
  dela (tradução faltando quebra o build) e teste confere variáveis `{{x}}` iguais nos três idiomas. Idioma segue o
  celular ou Perfil → Preferências. Números/datas via `i18n/format.ts` (nada de `'pt-BR'` fixo). Todas as telas,
  inclusive as prévias, o PDF e os textos do leitor de tela, revisadas para linguagem simples (F4-12).
- Pendente: revisão das traduções por falante nativo; a voz (prévia) só entende frases em português; nomes de
  alimentos da TACO e das fórmulas de índices (shared) seguem em português.

<details><summary>Plano original</summary>

#### Textos e idiomas
- Tirar os textos do código para arquivos de tradução (F4-36), revisando para **linguagem simples** (F4-12).
- Adicionar **inglês e espanhol** na interface. Nomes de alimentos da TACO seguem em português.

</details>

### 9. Qualidade
- ✅ **Maestro** (2026-10-10): criar conta → onboarding → anotar almoço → anotar peso → sair, passando
  normal e com fonte 200% + modo escuro. Ver `apps/mobile/.maestro/README.md`.
- ✅ **Acessibilidade pela árvore** (2026-10-10), em vez do TalkBack, que não aceita gestos injetados no emulador. Achados corrigidos e pendências na issue #34 de `docs/backlog-fase4.md`. **TalkBack de verdade: o usuário testa no próprio celular, quando o app estiver na Play Store.**
- Atualizar o **relatório visual** (artifact) com as telas novas.

### Depois (Fase 5 de verdade)
- API de exames (upload R2, fila, extração por IA, revisão) e transcrição de voz por IA — decidir antes o
  portão de orçamento da IA. As telas e as calculadoras já estão prontas e esperando.

## Pendências do dono
- Testar no celular o envio de exame por câmera, galeria e PDF.
- Fechar no GitHub: `gh issue close 9; gh issue close 20; gh issue close 21; gh issue close 31`.
