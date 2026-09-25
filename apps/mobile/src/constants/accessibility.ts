/**
 * Lado mínimo de um alvo de toque, em dp.
 *
 * Auditoria de 2026-09-25 encontrou chips do onboarding com ~36 dp e botões com
 * ~44 dp — ambos abaixo do mínimo. Referência: ABNT NBR 17060:2022, a norma
 * brasileira de acessibilidade em apps móveis, alinhada ao WCAG.
 *
 * Aplicar como `minHeight` no elemento tocável, não como `hitSlop`: aumentar o
 * alvo de verdade ajuda quem tem dificuldade motora a *enxergar* onde tocar,
 * enquanto `hitSlop` só amplia uma área invisível — e, em linhas com quebra,
 * ainda corre o risco de sobrepor o vizinho.
 */
export const MIN_TOUCH_TARGET = 48;
