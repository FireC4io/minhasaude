import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, RefreshToken, Profile, Consent, AccountDeletionRequest, BodyMeasurement } from './entities';
import type { Env } from '../config/env.schema';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres' as const,
        url: config.get('DATABASE_URL', { infer: true }),
        entities: [User, RefreshToken, Profile, Consent, AccountDeletionRequest, BodyMeasurement],
        // Migrations aplicadas manualmente (migration:run) - nunca synchronize
        // em ambiente algum, ver CLAUDE.md.
        synchronize: false,
        logging: config.get('NODE_ENV', { infer: true }) !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}
