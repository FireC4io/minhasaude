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
      { target: '@logtail/pino', options: { sourceToken } },
    ],
  };
}
