# Plano da próxima sessão (a partir de 2026-10-07)

Contexto completo: `docs/noite-2026-10-06.md` (o que foi feito, decisões, achados) e o quadro de status no
topo do Bloco B em `docs/backlog-fase4.md`. Toda mudança de backend vai para produção no push (Render):
migrations com cuidado, testes antes, e avisar o dono antes de publicar mudança de banco.

## Ordem sugerida

### 1. Exclusão de conta permanente (backend + app) — decisão do dono
- Login recusa conta em `PENDING_DELETION` (ou exclusão imediata, sem prazo — confirmar qual no início).
- Antes de confirmar, a tela mostra o que será apagado e oferece **baixar o relatório de progresso**.
- Testes unitários + e2e; conferir que o `ON DELETE CASCADE` cobre tudo.

### 2. Relatório de progresso para baixar
- Definir com o dono o conteúdo (peso, médias, metas, diário; exames quando existirem) e o formato
  (PDF legível é o mais provável). Reaproveitar na exclusão de conta e no Perfil.
- Junto: discutir o conteúdo exato da exportação LGPD (incluir alimentos cadastrados pela pessoa).

### 3. Busca de alimento por relevância (backend)
- Ordenar: começa com o termo → contém o termo → similaridade `pg_trgm`; forma comum (cozido) e nome curto
  antes de prato composto; alimentos mais registrados pela pessoa primeiro; sinônimos simples.
- Testes com casos reais: "arroz", "feijão", "pão", "banana".

### 4. Login com Google — prioridade de comodidade
- **Passo do dono**: criar projeto no Google Cloud e a tela de consentimento OAuth (gratuito).
- Backend: endpoint que valida o token do Google e cria/vincula a conta; app: `expo-auth-session`.
- Recuperar senha por e-mail na mesma leva (a tela já existe em prévia): escolher serviço de e-mail com nível
  gratuito.

### 5. Tempo da cópia no celular escolhido pela pessoa
- Perfil → Preferências: 1, 7 ou 30 dias (máximo 30). Hoje é fixo em 24 h (`PERSIST_MAX_AGE_MS`).

### 6. Ritmo semanal no onboarding
- Opções 0,25 / 0,5 / 0,75 kg por semana, conservadora marcada, texto sem promessa (RDC 657/2022).
- Precisa de campo novo na meta (API + migration + calculadora com `calculator_version`).

### 7. Micronutrientes
- Expor fibras, sódio, cálcio, ferro e vitaminas da TACO (`fiberGPer100g` já existe no banco). Mostrar na
  busca, na conta da quantidade e no resumo do dia.

### 8. Textos e idiomas
- Tirar os textos do código para arquivos de tradução (F4-36), revisando para **linguagem simples** (F4-12).
- Adicionar **inglês e espanhol** na interface. Nomes de alimentos da TACO seguem em português.

### 9. Qualidade
- **Maestro**: fluxos criar conta → onboarding → registrar almoço → registrar peso → sair, também com fonte
  em 200% e modo escuro.
- **TalkBack** de ponta a ponta no emulador; corrigir o que falhar.
- Atualizar o **relatório visual** (artifact) com as telas novas.

### Depois (Fase 5 de verdade)
- API de exames (upload R2, fila, extração por IA, revisão) e transcrição de voz por IA — decidir antes o
  portão de orçamento da IA. As telas e as calculadoras já estão prontas e esperando.

## Pendências do dono
- Testar no celular o envio de exame por câmera, galeria e PDF.
- Fechar no GitHub: `gh issue close 9; gh issue close 20; gh issue close 21; gh issue close 31`.
