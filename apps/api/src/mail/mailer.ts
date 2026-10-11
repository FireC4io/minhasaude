export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Porta de saída de e-mail. Quem envia não sabe qual provedor está por trás:
 * Brevo em produção, pasta local em desenvolvimento, falso nos testes.
 */
export abstract class Mailer {
  abstract send(message: MailMessage): Promise<void>;
}
