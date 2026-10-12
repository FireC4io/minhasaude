import 'dotenv/config';
import { DataSource } from 'typeorm';
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
import { databaseSsl } from './database-ssl';

// Fonte de dados usada pela CLI do TypeORM (migration:generate/run/revert).
// A NestJS app em si usa DatabaseModule (TypeOrmModule.forRootAsync), que lê
// a mesma DATABASE_URL via ConfigService em vez de dotenv direto.
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: databaseSsl(
    (process.env.DATABASE_SSL as 'disable' | 'require' | 'verify-full' | undefined) ?? 'disable',
    process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n'),
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
  migrations: ['src/database/migrations/*.ts'],
  // Uma transação por migration: valor novo de enum (ALTER TYPE ... ADD VALUE)
  // só pode ser usado depois do commit, e a migration seguinte precisa dele.
  migrationsTransactionMode: 'each',
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});

export default AppDataSource;
