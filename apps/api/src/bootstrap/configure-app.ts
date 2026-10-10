import { ValidationPipe } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import type { Env } from '../config/env.schema';

/**
 * Tudo o que protege a API na borda, num lugar só: o `main.ts` e os testes de
 * segurança usam esta mesma função, para o teste exercitar a configuração que
 * vai para produção — e não uma cópia parcial dela.
 */
export function configureApp(app: NestExpressApplication, config: ConfigService<Env, true>): void {
  app.set('trust proxy', config.get('TRUST_PROXY_HOPS', { infer: true }));

  app.use(helmet());

  app.setGlobalPrefix('v1', { exclude: ['health'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
  });
}
