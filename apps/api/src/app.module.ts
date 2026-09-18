import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { BodyMeasurementsModule } from './body-measurements/body-measurements.module';
import { ConfigurationModule } from './config/configuration.module';
import { buildPinoTransport } from './config/pino-transport';
import { ConsentsModule } from './consents/consents.module';
import { DatabaseModule } from './database/database.module';
import { DiaryModule } from './diary/diary.module';
import { FoodsModule } from './foods/foods.module';
import { GoalsModule } from './goals/goals.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    AuthModule,
    ConsentsModule,
    UsersModule,
    BodyMeasurementsModule,
    GoalsModule,
    FoodsModule,
    DiaryModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: buildPinoTransport(),
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
