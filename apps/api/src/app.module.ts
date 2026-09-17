import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigurationModule } from './config/configuration.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        // Nunca logar dados sensíveis (senha, tokens, dados de exame) - ver CLAUDE.md.
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.token',
            'req.body.refreshToken',
          ],
          censor: '[REDACTED]',
        },
      },
    }),
    HealthModule,
  ],
})
export class AppModule {}
