/**
 * Telas cuja API ainda não existe (exames, voz, água, notas, recuperar senha)
 * funcionam com dados de demonstração e um aviso visível. Ficam ligadas no
 * desenvolvimento e **desligadas no build de produção**: há usuários reais, e
 * nada inventado pode chegar a eles como se fosse dado de verdade.
 *
 * Para ver num build de teste: EXPO_PUBLIC_PREVIEW_FEATURES=true.
 */
export const PREVIEW_FEATURES: boolean =
  __DEV__ || process.env.EXPO_PUBLIC_PREVIEW_FEATURES === 'true';
