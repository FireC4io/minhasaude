import { MigrationInterface, QueryRunner } from 'typeorm';

const API_ROLES = ['anon', 'authenticated'];

/**
 * Segundo cadeado, independente do RLS. O Supabase dá aos papéis da API REST
 * automática (`anon`, `authenticated`) permissão em toda tabela do schema
 * public; até aqui só o RLS sem policy os barrava. O app nunca usa esse
 * caminho (a API conecta direto no Postgres como dona das tabelas), então as
 * permissões saem — inclusive para tabelas criadas no futuro, que antes
 * nasciam abertas até alguém lembrar de ligar o RLS.
 *
 * Também fixa o search_path da `immutable_unaccent` (aviso do advisor do
 * Supabase): sem isso, quem criasse um objeto com o mesmo nome num schema
 * anterior no caminho mudaria o que a função executa.
 *
 * No Postgres local (docker) esses papéis não existem; a migration só age onde
 * eles existem.
 */
export class RevokePublicApiGrants1791400500000 implements MigrationInterface {
  name = 'RevokePublicApiGrants1791400500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const role of await this.existingRoles(queryRunner)) {
      await queryRunner.query(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM "${role}"`);
      await queryRunner.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM "${role}"`);
      await queryRunner.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM "${role}"`,
      );
      await queryRunner.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM "${role}"`,
      );
    }
    await queryRunner.query(
      `ALTER FUNCTION public.immutable_unaccent(text) SET search_path = public, pg_temp`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER FUNCTION public.immutable_unaccent(text) RESET search_path`);
    for (const role of await this.existingRoles(queryRunner)) {
      await queryRunner.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${role}"`,
      );
      await queryRunner.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${role}"`,
      );
      await queryRunner.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "${role}"`);
      await queryRunner.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO "${role}"`);
    }
  }

  private async existingRoles(queryRunner: QueryRunner): Promise<string[]> {
    const rows: { rolname: string }[] = await queryRunner.query(
      `SELECT rolname FROM pg_roles WHERE rolname = ANY($1)`,
      [API_ROLES],
    );
    return rows.map((row) => row.rolname);
  }
}
