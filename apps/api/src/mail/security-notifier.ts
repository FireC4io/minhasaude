import { Injectable, Logger } from '@nestjs/common';
import { Mailer, type MailMessage } from './mailer';

export type SecurityEvent = 'password_changed' | 'google_linked' | 'google_linked_password_removed' | 'account_deleted';

const CONTACT = 'euacaio14@gmail.com';
const IF_NOT_YOU = `Se não foi você, abra o app, toque em "Esqueci minha senha" para criar uma senha nova e escreva para ${CONTACT}.`;

const NOTICES: Record<SecurityEvent, { subject: string; body: string[] }> = {
  password_changed: {
    subject: 'Sua senha do Gota Vital foi trocada',
    body: [
      'A senha da sua conta no Gota Vital acabou de ser trocada com o código enviado por e-mail.',
      'Por segurança, todas as sessões abertas foram encerradas.',
      IF_NOT_YOU,
    ],
  },
  google_linked: {
    subject: 'Login com Google ligado à sua conta',
    body: ['Sua conta no Gota Vital agora também entra com o Google.', IF_NOT_YOU],
  },
  google_linked_password_removed: {
    subject: 'Login com Google ligado à sua conta',
    body: [
      'Sua conta no Gota Vital agora entra com o Google.',
      'Como o e-mail desta conta ainda não tinha sido confirmado, a senha antiga foi apagada e as outras sessões foram encerradas. Se quiser voltar a entrar com senha, use "Esqueci minha senha" no app.',
      `Se não foi você, escreva para ${CONTACT}.`,
    ],
  },
  account_deleted: {
    subject: 'Sua conta do Gota Vital foi apagada',
    body: [
      'Sua conta e todos os seus dados no Gota Vital foram apagados, como você pediu.',
      'Cópias de segurança cifradas expiram sozinhas em até 60 dias.',
      `Se você não pediu isso, escreva para ${CONTACT}.`,
    ],
  },
};

export function buildSecurityNotice(to: string, event: SecurityEvent): MailMessage {
  const notice = NOTICES[event];
  const paragraphs = [...notice.body, 'Gota Vital'];
  // Só texto fixo: nada que a pessoa digitou entra no HTML.
  const html = `<div style="font-family:Arial,sans-serif;font-size:18px;line-height:1.5;color:#2b2b2b">${paragraphs
    .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')}</p>`)
    .join('')}</div>`;
  return { to, subject: notice.subject, text: paragraphs.join('\n\n'), html };
}

/**
 * Avisa a pessoa de mudanças de segurança na conta, para ela perceber se
 * alguém mexeu nela. O envio não segura a resposta nem a derruba: falha vira
 * erro no log.
 */
@Injectable()
export class SecurityNotifier {
  private readonly logger = new Logger(SecurityNotifier.name);

  constructor(private readonly mailer: Mailer) {}

  notify(to: string, event: SecurityEvent, accountId: string): void {
    void this.mailer.send(buildSecurityNotice(to, event)).catch((error: unknown) => {
      this.logger.error(
        `Aviso de segurança "${event}" não saiu para a conta ${accountId}`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }
}
