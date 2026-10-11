import { INPUT_LIMITS } from '@minhasaude/shared';

import { createErrorReporter, type ClientErrorReport } from './error-reporter';

function setup(enabled = true) {
  const sent: ClientErrorReport[] = [];
  const reporter = createErrorReporter({
    enabled,
    send: async (report) => {
      sent.push(report);
    },
    context: () => ({ screen: '/(app)', appVersion: '1.0.0 (2)', platform: 'android' }),
  });
  return { sent, reporter };
}

describe('error reporter', () => {
  it('envia mensagem, pilha, tela, versão e se derrubou a tela', async () => {
    const { sent, reporter } = setup();
    const error = new TypeError("Cannot read property 'kcal' of undefined");

    await reporter.report(error, { fatal: true });

    expect(sent).toEqual([
      {
        message: "TypeError: Cannot read property 'kcal' of undefined",
        stack: expect.any(String),
        screen: '/(app)',
        appVersion: '1.0.0 (2)',
        platform: 'android',
        fatal: true,
      },
    ]);
  });

  it('corta os textos nos limites que a API aceita', async () => {
    const { sent, reporter } = setup();
    const error = new Error('x'.repeat(5000));
    error.stack = 'y'.repeat(10_000);

    await reporter.report(error, { fatal: false });

    expect(sent[0]?.message.length).toBeLessThanOrEqual(INPUT_LIMITS.clientErrorMessage);
    expect(sent[0]?.stack?.length).toBeLessThanOrEqual(INPUT_LIMITS.clientErrorStack);
  });

  it('não repete a mesma mensagem e para depois de 5 por sessão', async () => {
    const { sent, reporter } = setup();
    for (let i = 0; i < 3; i++) await reporter.report(new Error('igual'), { fatal: false });
    for (let i = 0; i < 10; i++) await reporter.report(new Error(`diferente ${i}`), { fatal: false });

    expect(sent.filter((r) => r.message === 'Error: igual')).toHaveLength(1);
    expect(sent).toHaveLength(5);
  });

  it('desligado (desenvolvimento), não envia nada', async () => {
    const { sent, reporter } = setup(false);
    await reporter.report(new Error('x'), { fatal: true });
    expect(sent).toHaveLength(0);
  });

  it('falha no envio nunca vira outro erro', async () => {
    const reporter = createErrorReporter({
      enabled: true,
      send: async () => {
        throw new Error('sem internet');
      },
      context: () => ({ screen: '/', appVersion: '1.0.0', platform: 'android' }),
    });
    await expect(reporter.report(new Error('x'), { fatal: false })).resolves.toBeUndefined();
  });

  it('aceita qualquer coisa lançada, não só Error', async () => {
    const { sent, reporter } = setup();
    await reporter.report('texto solto', { fatal: false });
    expect(sent[0]?.message).toBe('texto solto');
  });
});
