import { Mailer, type MailMessage } from './mailer';

export const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';
const REQUEST_TIMEOUT_MS = 10_000;

export interface BrevoSender {
  apiKey: string;
  fromAddress: string;
  fromName: string;
}

/** Envio pela API HTTP do Brevo (e-mail transacional). */
export class BrevoMailer extends Mailer {
  constructor(
    private readonly sender: BrevoSender,
    private readonly fetchFn: typeof fetch = fetch,
  ) {
    super();
  }

  async send(message: MailMessage): Promise<void> {
    const response = await this.fetchFn(BREVO_SEND_URL, {
      method: 'POST',
      headers: {
        'api-key': this.sender.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: this.sender.fromAddress, name: this.sender.fromName },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: message.html,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      // Só o status: o corpo do Brevo pode repetir o destinatário.
      throw new Error(`Brevo recusou o envio (HTTP ${response.status})`);
    }
  }
}
