import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { INPUT_LIMITS } from '@minhasaude/shared';

const CODE_SPACE = 10 ** INPUT_LIMITS.passwordResetCode;

/** Código numérico com zeros à esquerda, sorteado com gerador criptográfico. */
export function generateResetCode(): string {
  return randomInt(0, CODE_SPACE).toString().padStart(INPUT_LIMITS.passwordResetCode, '0');
}

/**
 * HMAC com segredo do servidor e amarrado à conta: o mesmo código de outra
 * pessoa dá outro hash, e quem tiver só o banco não testa as 10^6 combinações.
 */
export function hashResetCode(secret: string, userId: string, code: string): string {
  return createHmac('sha256', secret).update(`password-reset:${userId}:${code}`).digest('hex');
}

export function resetCodeMatches(secret: string, userId: string, code: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashResetCode(secret, userId, code), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}
