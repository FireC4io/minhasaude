import { Mailer } from './mailer';

/** Produção sem Brevo configurado: falha alto (vira erro no log) em vez de fingir que enviou. */
export class DisabledMailer extends Mailer {
  send(): Promise<void> {
    return Promise.reject(
      new Error('Envio de e-mail desligado: faltam BREVO_API_KEY e/ou EMAIL_FROM_ADDRESS'),
    );
  }
}
