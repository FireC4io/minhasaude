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
} from './entities';
import type { Env } from '../config/env.schema';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres' as const,
        url: config.get('DATABASE_URL', { infer: true }),
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
        ],
        // Migrations aplicadas no boot: antes dependiam de `migration:run` à mão,
        // e as da Fase 2 em diante nunca chegaram à produção (descoberto em
        // 2026-10-07). Compilado lê os .js de dist; em teste (ts-jest), os .ts.
        migrations: [join(__dirname, 'migrations', `*.${__filename.endsWith('.ts') ? 'ts' : 'js'}`)],
        migrationsRun: true,
        // Nunca synchronize em ambiente algum, ver CLAUDE.md.
        synchronize: false,
        logging: config.get('NODE_ENV', { infer: true }) !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}
