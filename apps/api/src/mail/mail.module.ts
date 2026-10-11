import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import { BrevoMailer } from './brevo-mailer';
import { DisabledMailer } from './disabled-mailer';
import { LocalOutboxMailer } from './local-outbox-mailer';
import { Mailer } from './mailer';

export function createMailer(config: ConfigService<Env, true>): Mailer {
  const apiKey = config.get('BREVO_API_KEY', { infer: true });
  const fromAddress = config.get('EMAIL_FROM_ADDRESS', { infer: true });
  if (apiKey && fromAddress) {
    return new BrevoMailer({
      apiKey,
      fromAddress,
      fromName: config.get('EMAIL_FROM_NAME', { infer: true }),
    });
  }
  // Pasta local só na máquina de quem desenvolve; qualquer outro ambiente sem chave recusa enviar.
  return config.get('NODE_ENV', { infer: true }) === 'development'
    ? new LocalOutboxMailer()
    : new DisabledMailer();
}

@Module({
  imports: [ConfigModule],
  providers: [{ provide: Mailer, inject: [ConfigService], useFactory: createMailer }],
  exports: [Mailer],
})
export class MailModule {}
