import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { Mailer, type MailMessage } from './mailer';

export const LOCAL_OUTBOX_DIR = join(tmpdir(), 'gotavital-mail');

/**
 * Só em desenvolvimento, sem chave do Brevo: cada e-mail vira um arquivo numa
 * pasta temporária, para testar o fluxo inteiro sem mandar nada de verdade.
 * Fica fora do log de propósito — o e-mail carrega o código de acesso.
 */
export class LocalOutboxMailer extends Mailer {
  private readonly logger = new Logger(LocalOutboxMailer.name);

  constructor(private readonly dir: string = LOCAL_OUTBOX_DIR) {
    super();
  }

  async send(message: MailMessage): Promise<void> {
    await mkdir(this.dir, { recursive: true, mode: 0o700 });
    const file = join(this.dir, `${Date.now()}-${randomUUID()}.txt`);
    await writeFile(file, `Para: ${message.to}\nAssunto: ${message.subject}\n\n${message.text}\n`, {
      mode: 0o600,
    });
    this.logger.warn(`Sem BREVO_API_KEY: e-mail gravado em ${file}`);
  }
}
