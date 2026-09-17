import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User, RefreshToken, Profile } from './entities';

// Fonte de dados usada pela CLI do TypeORM (migration:generate/run/revert).
// A NestJS app em si usa DatabaseModule (TypeOrmModule.forRootAsync), que lê
// a mesma DATABASE_URL via ConfigService em vez de dotenv direto.
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, RefreshToken, Profile],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});

export default AppDataSource;
