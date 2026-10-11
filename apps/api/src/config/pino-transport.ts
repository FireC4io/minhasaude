import type { TransportMultiOptions, TransportSingleOptions } from 'pino';

// Em dev, saída legível no terminal. Em produção, mantém JSON em stdout (Render
// já coleta isso) e, se houver token, encaminha em paralelo pro BetterStack.
export function buildPinoTransport():
  | TransportSingleOptions
  | TransportMultiOptions
  | undefined {
  if (process.env.NODE_ENV !== 'production') {
    return { target: 'pino-pretty', options: { singleLine: true } };
  }

  const sourceToken = process.env.BETTERSTACK_SOURCE_TOKEN;
  if (!sourceToken) {
    return undefined;
  }

  return {
    targets: [
      { target: 'pino/file', options: { destination: 1 } },
      { target: '@logtail/pino', options: { sourceToken, options: logtailOptions() } },
    ],
  };
}

// Sources novas do Better Stack têm endereço próprio; o padrão da biblioteca
// (in.logs.betterstack.com) só serve às antigas, e o envio falha em silêncio.
export function logtailOptions(): { endpoint: string } | undefined {
  const host = process.env.BETTERSTACK_INGESTING_HOST?.trim();
  if (!host) {
    return undefined;
  }
  return { endpoint: host.startsWith('https://') ? host : `https://${host}` };
}
