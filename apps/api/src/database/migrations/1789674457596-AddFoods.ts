import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFoods1789674457596 implements MigrationInterface {
    name = 'AddFoods1789674457596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // pg_trgm (fuzzy match) + unaccent (ignorar acento na busca) - ver ADR-0004.
        // Não modelados pelas entidades porque TypeORM não expressa operator
        // class (gin_trgm_ops) declarativamente - adicionados à mão aqui.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);
        await queryRunner.query(`CREATE TYPE "public"."foods_source_enum" AS ENUM('taco', 'off', 'custom')`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`, ["minhasaude","public","foods","GENERATED_COLUMN","search_vector","to_tsvector('portuguese', coalesce(name, ''))"]);
        await queryRunner.query(`CREATE TABLE "foods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "source" "public"."foods_source_enum" NOT NULL, "external_id" character varying, "owner_user_id" uuid, "name" character varying NOT NULL, "brand" character varying, "barcode" character varying, "kcal_per_100g" numeric(7,2) NOT NULL, "protein_g_per_100g" numeric(6,2) NOT NULL, "fat_g_per_100g" numeric(6,2) NOT NULL, "carb_g_per_100g" numeric(6,2) NOT NULL, "fiber_g_per_100g" numeric(6,2), "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(name, ''))) STORED NOT NULL, CONSTRAINT "PK_0cc83421325632f61fa27a52b59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_54063cba2ded046061587b7494" ON "foods"  ("owner_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_94919a5b0af8952c73beb42fbc" ON "foods"  ("barcode") `);
        await queryRunner.query(`CREATE INDEX "IDX_foods_search_vector" ON "foods" USING GIN ("search_vector")`);
        await queryRunner.query(`CREATE INDEX "IDX_foods_name_trgm" ON "foods" USING GIN ("name" gin_trgm_ops)`);
        await queryRunner.query(`CREATE TABLE "food_portions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "food_id" uuid NOT NULL, "label" character varying NOT NULL, "grams" numeric(7,2) NOT NULL, CONSTRAINT "PK_499dde8c7dc1ea36a1fbe0a53f6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fdeef74a1c82393d5ea8862300" ON "food_portions"  ("food_id") `);
        await queryRunner.query(`ALTER TABLE "foods" ADD CONSTRAINT "FK_54063cba2ded046061587b74944" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "food_portions" ADD CONSTRAINT "FK_fdeef74a1c82393d5ea88623005" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "food_portions" DROP CONSTRAINT "FK_fdeef74a1c82393d5ea88623005"`);
        await queryRunner.query(`ALTER TABLE "foods" DROP CONSTRAINT "FK_54063cba2ded046061587b74944"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fdeef74a1c82393d5ea8862300"`);
        await queryRunner.query(`DROP TABLE "food_portions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_foods_name_trgm"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_foods_search_vector"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_94919a5b0af8952c73beb42fbc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_54063cba2ded046061587b7494"`);
        await queryRunner.query(`DROP TABLE "foods"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`, ["GENERATED_COLUMN","search_vector","minhasaude","public","foods"]);
        await queryRunner.query(`DROP TYPE "public"."foods_source_enum"`);
        // Extensões não são removidas no down: podem estar em uso por outras
        // tabelas/migrations futuras, e DROP EXTENSION é uma operação
        // destrutiva demais pra reverter automaticamente aqui.
    }

}
