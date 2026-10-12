import { isAxiosError } from 'axios';

/**
 * O que fazer com uma anotação cujo envio falhou.
 * - `offline`: nem chegou resposta (sem internet, tempo esgotado). Guarda e para de tentar por agora.
 * - `retry`: o servidor respondeu, mas com problema passageiro (fora do ar, muitos pedidos). Guarda.
 * - `reject`: o servidor recusou a anotação. Tentar de novo não muda nada.
 */
export type SendOutcome = 'offline' | 'retry' | 'reject';

const TEMPORARY_STATUS = new Set([401, 408, 429]);

export function sendOutcome(error: unknown): SendOutcome {
  // Erro que não veio do pedido (sessão sem renovação, por exemplo): na dúvida, guarda.
  if (!isAxiosError(error)) return 'retry';
  const status = error.response?.status;
  if (status === undefined) return 'offline';
  if (status >= 500 || TEMPORARY_STATUS.has(status)) return 'retry';
  return 'reject';
}
