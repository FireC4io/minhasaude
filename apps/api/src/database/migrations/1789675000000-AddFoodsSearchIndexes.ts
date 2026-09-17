import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFoodsSearchIndexes1789675000000 implements MigrationInterface {
  name = 'AddFoodsSearchIndexes1789675000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // unaccent(text) de 1 argumento não é IMMUTABLE (faz lookup do dicionário
    // configurado em tempo de execução) - Postgres recusa usá-la em índice.
    // A forma de 2 argumentos com o dicionário fixo pode ser marcada
    // IMMUTABLE com segurança - padrão documentado pra indexar/buscar texto
    // sem acento (ver ADR-0004).
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION immutable_unaccent(text)
      RETURNS text AS $$
        SELECT public.unaccent('public.unaccent', $1)
      $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
    `);

    // Substitui o índice trigram simples da issue #13 por um sobre o nome já
    // normalizado (minúsculo + sem acento), pra buscas como "acucar" baterem
    // com "Açúcar".
    await queryRunner.query(`DROP INDEX "public"."IDX_foods_name_trgm"`);
    await queryRunner.query(`
      CREATE INDEX "IDX_foods_name_unaccent_trgm" ON "foods"
      USING GIN (immutable_unaccent(lower("name")) gin_trgm_ops)
    `);

    // Evita cache duplicado do mesmo produto (TACO ou OFF) se duas buscas
    // concorrentes tentarem cachear o mesmo item ao mesmo tempo.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_foods_source_external_id" ON "foods" ("source", "external_id")
      WHERE "external_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_foods_source_external_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_foods_name_unaccent_trgm"`);
    await queryRunner.query(`CREATE INDEX "IDX_foods_name_trgm" ON "foods" USING GIN ("name" gin_trgm_ops)`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS immutable_unaccent(text)`);
  }
}
