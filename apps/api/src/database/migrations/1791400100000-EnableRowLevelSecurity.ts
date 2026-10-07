import { MigrationInterface, QueryRunner } from 'typeorm';

// Toda tabela do schema public. Tabela nova precisa entrar aqui (ou numa
// migration própria) — o advisor do Supabase acusa a que ficar de fora.
const TABLES = [
  'migrations',
  'typeorm_metadata',
  'users',
  'refresh_tokens',
  'profiles',
  'consents',
  'account_deletion_requests',
  'body_measurements',
  'goal_targets',
  'foods',
  'food_portions',
  'diary_entries',
];

/**
 * O Supabase expõe o schema public pela API REST automática (PostgREST) para
 * quem tiver a chave pública do projeto. O app não usa esse caminho — a API
 * conecta direto no Postgres —, mas sem RLS essa porta ficava aberta.
 *
 * RLS ligado e nenhuma policy: os papéis `anon`/`authenticated` não leem nem
 * escrevem nada. A API conecta como dona das tabelas, e dono não passa por RLS
 * (não usamos FORCE), então nada muda para ela.
 */
export class EnableRowLevelSecurity1791400100000 implements MigrationInterface {
  name = 'EnableRowLevelSecurity1791400100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
  }
}
