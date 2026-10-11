import { createHmac, hkdfSync, randomInt, timingSafeEqual } from 'node:crypto';
import { INPUT_LIMITS } from '@minhasaude/shared';

const CODE_SPACE = 10 ** INPUT_LIMITS.passwordResetCode;

/** Código numérico com zeros à esquerda, sorteado com gerador criptográfico. */
export function generateResetCode(): string {
  return randomInt(0, CODE_SPACE).toString().padStart(INPUT_LIMITS.passwordResetCode, '0');
}

/**
 * Chave só dos códigos, derivada do segredo do servidor (HKDF com rótulo
 * próprio): nada que se descubra sobre uma das chaves serve para a outra, e
 * não é preciso mais uma variável de ambiente.
 */
export function deriveResetCodeKey(serverSecret: string): Buffer {
  return Buffer.from(hkdfSync('sha256', serverSecret, '', 'gotavital/password-reset-code/v1', 32));
}

/**
 * HMAC com a chave dos códigos e amarrado à conta: o mesmo código de outra
 * pessoa dá outro hash, e quem tiver só o banco não testa as 10^6 combinações.
 */
export function hashResetCode(secret: Buffer | string, userId: string, code: string): string {
  return createHmac('sha256', secret).update(`password-reset:${userId}:${code}`).digest('hex');
}

export function resetCodeMatches(
  secret: Buffer | string,
  userId: string,
  code: string,
  storedHash: string,
): boolean {
  const candidate = Buffer.from(hashResetCode(secret, userId, code), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}
