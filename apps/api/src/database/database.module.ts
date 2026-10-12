import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  RefreshToken,
  Profile,
  Consent,
  AccountDeletionRequest,
  BodyMeasurement,
  GoalTarget,
  Food,
  FoodPortion,
  DiaryEntry,
  PasswordResetCode,
  AuditEvent,
} from './entities';
import type { Env } from '../config/env.schema';
import { databaseSsl } from './database-ssl';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres' as const,
        url: config.get('DATABASE_URL', { infer: true }),
        ssl: databaseSsl(
          config.get('DATABASE_SSL', { infer: true }),
          config.get('DATABASE_SSL_CA', { infer: true }),
        ),
        entities: [
          User,
          RefreshToken,
          Profile,
          Consent,
          AccountDeletionRequest,
          BodyMeasurement,
          GoalTarget,
          Food,
          FoodPortion,
          DiaryEntry,
          PasswordResetCode,
          AuditEvent,
        ],
        // Migrations aplicadas no boot: antes dependiam de `migration:run` à mão,
        // e as da Fase 2 em diante nunca chegaram à produção (descoberto em
        // 2026-10-07). Compilado lê os .js de dist; em teste (ts-jest), os .ts.
        migrations: [join(__dirname, 'migrations', `*.${__filename.endsWith('.ts') ? 'ts' : 'js'}`)],
        migrationsRun: true,
        // Uma transação por migration: valor novo de enum (ALTER TYPE ... ADD VALUE)
        // só pode ser usado depois do commit, e a migration seguinte precisa dele.
        migrationsTransactionMode: 'each',
        // Nunca synchronize em ambiente algum, ver CLAUDE.md.
        synchronize: false,
        logging: config.get('NODE_ENV', { infer: true }) !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}
