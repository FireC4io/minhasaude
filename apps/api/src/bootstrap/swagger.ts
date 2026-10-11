import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Env } from '../config/env.schema';

/**
 * Swagger (`/docs`, `/docs-json`) só fora de produção: lá não ajuda ninguém e
 * entregaria o mapa de rotas pronto. O client do app é gerado contra a API
 * local (`pnpm --filter mobile generate:api`).
 */
export function isSwaggerEnabled(nodeEnv: Env['NODE_ENV']): boolean {
  return nodeEnv !== 'production';
}

export function setupSwagger(app: INestApplication, config: ConfigService<Env, true>): void {
  if (!isSwaggerEnabled(config.get('NODE_ENV', { infer: true }))) {
    return;
  }
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gota Vital API')
    .setDescription('API do app de nutrição e acompanhamento de saúde.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
}
