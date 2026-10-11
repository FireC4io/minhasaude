import { buildSecurityNotice, SecurityNotifier } from './security-notifier';
import type { Mailer } from './mailer';

describe('avisos de segurança', () => {
  it('troca de senha diz o que fazer se não foi a pessoa', () => {
    const mail = buildSecurityNotice('maria@exemplo.com', 'password_changed');
    expect(mail.to).toBe('maria@exemplo.com');
    expect(mail.subject).toMatch(/senha/);
    expect(mail.text).toMatch(/Esqueci minha senha/);
    expect(mail.text).toMatch(/sessões abertas foram encerradas/);
  });

  it('Google ligado com senha apagada explica por quê', () => {
    expect(buildSecurityNotice('a@b.com', 'google_linked_password_removed').text).toMatch(/senha antiga foi apagada/);
  });

  it('conta apagada lembra das cópias de segurança', () => {
    expect(buildSecurityNotice('a@b.com', 'account_deleted').text).toMatch(/60 dias/);
  });

  it('escapa o HTML (aspas do texto fixo)', () => {
    expect(buildSecurityNotice('a@b.com', 'password_changed').html).toContain('&quot;Esqueci minha senha&quot;');
  });

  it('falha no envio não lança: vira log', async () => {
    const mailer = { send: jest.fn().mockRejectedValue(new Error('Brevo fora')) } as unknown as Mailer;
    expect(() => new SecurityNotifier(mailer).notify('a@b.com', 'account_deleted', 'conta-1')).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    expect(mailer.send).toHaveBeenCalled();
  });
});
