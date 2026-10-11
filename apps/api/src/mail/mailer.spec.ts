import type { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import { BREVO_SEND_URL, BrevoMailer } from './brevo-mailer';
import { DisabledMailer } from './disabled-mailer';
import { LocalOutboxMailer } from './local-outbox-mailer';
import { createMailer } from './mail.module';

const message = { to: 'pessoa@example.com', subject: 'Assunto', text: 'texto', html: '<p>texto</p>' };
const sender = { apiKey: 'chave-teste', fromAddress: 'gotavital@example.com', fromName: 'Gota Vital' };

function configWith(values: Partial<Env>): ConfigService<Env, true> {
  return { get: (key: keyof Env) => values[key] } as unknown as ConfigService<Env, true>;
}

describe('BrevoMailer', () => {
  it('manda remetente, destinatário e as duas versões do texto para a API do Brevo', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: true, status: 201 });
    await new BrevoMailer(sender, fetchFn).send(message);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(BREVO_SEND_URL);
    expect(init.headers['api-key']).toBe('chave-teste');
    expect(JSON.parse(init.body)).toEqual({
      sender: { email: 'gotavital@example.com', name: 'Gota Vital' },
      to: [{ email: 'pessoa@example.com' }],
      subject: 'Assunto',
      textContent: 'texto',
      htmlContent: '<p>texto</p>',
    });
  });

  it('falha quando o Brevo recusa, sem repetir o destinatário na mensagem', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: false, status: 401 });
    const sending = new BrevoMailer(sender, fetchFn).send(message);
    await expect(sending).rejects.toThrow('HTTP 401');
    await expect(sending).rejects.not.toThrow(/pessoa@example\.com/);
  });
});

describe('createMailer', () => {
  it('usa o Brevo quando chave e remetente existem', () => {
    const config = configWith({
      BREVO_API_KEY: 'k',
      EMAIL_FROM_ADDRESS: 'a@b.com',
      EMAIL_FROM_NAME: 'Gota Vital',
      NODE_ENV: 'production',
    });
    expect(createMailer(config)).toBeInstanceOf(BrevoMailer);
  });

  it('em produção sem chave, recusa enviar (erro no log) em vez de fingir', async () => {
    const mailer = createMailer(configWith({ NODE_ENV: 'production' }));
    expect(mailer).toBeInstanceOf(DisabledMailer);
    await expect(mailer.send(message)).rejects.toThrow(/BREVO_API_KEY/);
  });

  it('em desenvolvimento sem chave, grava o e-mail numa pasta local', () => {
    expect(createMailer(configWith({ NODE_ENV: 'development' }))).toBeInstanceOf(LocalOutboxMailer);
  });

  it('fora do desenvolvimento, nunca grava código em pasta local', () => {
    expect(createMailer(configWith({ NODE_ENV: 'test' }))).toBeInstanceOf(DisabledMailer);
  });
});
