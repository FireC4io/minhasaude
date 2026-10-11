import { isAxiosError } from 'axios';

export type ResetStep = 'send' | 'save';

type ResetErrorKey =
  | 'auth.forgot.tooMany'
  | 'auth.forgot.wrongCode'
  | 'auth.forgot.sendFailed'
  | 'auth.forgot.saveFailed';

/** Chave do texto de erro: limite de pedidos, código recusado ou falha de rede. */
export function resetErrorKey(error: unknown, step: ResetStep): ResetErrorKey {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status === 429) return 'auth.forgot.tooMany';
  if (step === 'save' && status === 400) return 'auth.forgot.wrongCode';
  return step === 'send' ? 'auth.forgot.sendFailed' : 'auth.forgot.saveFailed';
}
