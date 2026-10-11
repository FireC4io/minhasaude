import { Injectable } from '@nestjs/common';

export const LOGIN_MAX_FAILURES = 10;
export const LOGIN_WINDOW_MS = 15 * 60_000;
export const LOGIN_BLOCK_MS = 15 * 60_000;

interface Attempts {
  failures: number;
  windowStart: number;
  blockedUntil: number;
}

/**
 * Senhas erradas por e-mail digitado (exista a conta ou não, para não revelar
 * quem tem cadastro). Completa o limite por IP: quem troca de IP a cada
 * tentativa não testa senhas de uma conta sem parar.
 *
 * Em memória: a API roda numa instância só no Render. Reinício zera a
 * contagem, o que só devolve a quem ataca as tentativas de uma janela.
 */
@Injectable()
export class LoginAttemptLimiter {
  private readonly attempts = new Map<string, Attempts>();

  constructor(private readonly now: () => number = Date.now) {}

  isBlocked(email: string): boolean {
    const entry = this.attempts.get(normalize(email));
    return entry !== undefined && entry.blockedUntil > this.now();
  }

  recordFailure(email: string): void {
    const now = this.now();
    this.forgetExpired(now);
    const key = normalize(email);
    const current = this.attempts.get(key);
    const entry =
      current && now - current.windowStart <= LOGIN_WINDOW_MS
        ? { ...current, failures: current.failures + 1 }
        : { failures: 1, windowStart: now, blockedUntil: 0 };
    const blockedUntil = entry.failures >= LOGIN_MAX_FAILURES ? now + LOGIN_BLOCK_MS : entry.blockedUntil;
    this.attempts.set(key, { ...entry, blockedUntil });
  }

  recordSuccess(email: string): void {
    this.attempts.delete(normalize(email));
  }

  size(): number {
    return this.attempts.size;
  }

  private forgetExpired(now: number): void {
    for (const [key, entry] of this.attempts) {
      if (now - entry.windowStart > LOGIN_WINDOW_MS && entry.blockedUntil <= now) {
        this.attempts.delete(key);
      }
    }
  }
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}
