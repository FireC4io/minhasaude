import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import type { Env } from './config/env.schema';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Env, true>);

  configureApp(app, config);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gota Vital API')
    .setDescription('API do app de nutrição e acompanhamento de saúde.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
}

void bootstrap();
