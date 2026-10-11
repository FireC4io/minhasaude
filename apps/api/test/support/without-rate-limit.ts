import type { TestingModuleBuilder } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';

/**
 * Para suítes que testam outra coisa e fazem muitos pedidos seguidos (a busca
 * aceita 20 por minuto): o contador do throttler passa a nunca bloquear.
 * O guard e os decorators continuam no lugar; só a contagem some. Os testes do
 * próprio limite (security-*, password-reset) não usam isto.
 */
export function withoutRateLimit(builder: TestingModuleBuilder): TestingModuleBuilder {
  const record = { totalHits: 1, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
  return builder.overrideProvider(ThrottlerStorage).useValue({ increment: async () => record });
}
