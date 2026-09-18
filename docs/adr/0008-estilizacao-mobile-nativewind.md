# ADR-0008: Estilização do app mobile via NativeWind

## Status
Aceito (confirmado no planejamento da Fase 3, 2026-09-18)

## Contexto
O app mobile (Expo + Expo Router, Fase 3) precisa de uma abordagem de estilização antes de qualquer tela ser construída. Mobile é a área que você mesmo identificou como maior risco técnico do projeto (ver `docs/product-plan.md`), então a prioridade é adoção ampla e curva de aprendizado baixa em vez de flexibilidade máxima.

## Decisão
Usar **NativeWind** (Tailwind CSS aplicado a React Native/Expo via classes utilitárias).

## Justificativa
- Sintaxe de classe utilitária amplamente documentada, grande adoção na comunidade Expo/RN.
- Boa integração com Expo Router (o setup já decidido em `docs/roadmap.md` Fase 3).
- Não introduz um design system/runtime de tema próprio para aprender no meio da fase de maior risco técnico do projeto.

## Alternativas descartadas
- **StyleSheet nativo (RN puro)**: zero dependência extra e zero build step, mas mais verboso para telas com bastante composição (onboarding multi-etapa, diário). Descartado por produtividade, não por risco.
- **Tamagui**: design system tipado com otimização de compilação para performance — poder real, mas curva de aprendizado maior e mais uma peça nova numa fase já marcada como risco. Reavaliar se performance de estilização virar gargalo real (não esperado no volume de telas do MVP).
