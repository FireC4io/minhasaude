import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDiaryEntries1789737110507 implements MigrationInterface {
    name = 'AddDiaryEntries1789737110507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // NÃO remover os índices IDX_foods_search_vector / IDX_foods_source_external_id
        // aqui: o migration:generate propôs isso por engano, porque eles foram
        // criados via SQL bruto nas issues #13/#14 (search_vector é coluna
        // gerada com GIN, e o índice único usa expressão) e não são
        // modelados pelas entidades - o TypeORM não tem como "ver" eles e os
        // trata como drift a corrigir. Seguem intactos.
        await queryRunner.query(`CREATE TYPE "public"."diary_entries_meal_type_enum" AS ENUM('breakfast', 'lunch', 'dinner', 'snack')`);
        await queryRunner.query(`CREATE TYPE "public"."diary_entries_unit_enum" AS ENUM('grams', 'portion')`);
        await queryRunner.query(`CREATE TABLE "diary_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "food_id" uuid NOT NULL, "entry_date" date NOT NULL, "meal_type" "public"."diary_entries_meal_type_enum" NOT NULL, "quantity" numeric(7,2) NOT NULL, "unit" "public"."diary_entries_unit_enum" NOT NULL, "portion_id" uuid, "kcal_snapshot" numeric(7,2) NOT NULL, "protein_g_snapshot" numeric(6,2) NOT NULL, "fat_g_snapshot" numeric(6,2) NOT NULL, "carb_g_snapshot" numeric(6,2) NOT NULL, CONSTRAINT "PK_45cc0613be17fab8a954db677a0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d0702071f5a2490922d1b2156c" ON "diary_entries"  ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_81c883ad156fb2f90b6dcaf15b" ON "diary_entries"  ("food_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_36b6237498354920ca5ee66c7d" ON "diary_entries"  ("entry_date") `);
        await queryRunner.query(`ALTER TABLE "diary_entries" ADD CONSTRAINT "FK_d0702071f5a2490922d1b2156c8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "diary_entries" ADD CONSTRAINT "FK_81c883ad156fb2f90b6dcaf15bc" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "diary_entries" ADD CONSTRAINT "FK_79e86793b51993e5ddc17e9da77" FOREIGN KEY ("portion_id") REFERENCES "food_portions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diary_entries" DROP CONSTRAINT "FK_79e86793b51993e5ddc17e9da77"`);
        await queryRunner.query(`ALTER TABLE "diary_entries" DROP CONSTRAINT "FK_81c883ad156fb2f90b6dcaf15bc"`);
        await queryRunner.query(`ALTER TABLE "diary_entries" DROP CONSTRAINT "FK_d0702071f5a2490922d1b2156c8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_36b6237498354920ca5ee66c7d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_81c883ad156fb2f90b6dcaf15b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d0702071f5a2490922d1b2156c"`);
        await queryRunner.query(`DROP TABLE "diary_entries"`);
        await queryRunner.query(`DROP TYPE "public"."diary_entries_unit_enum"`);
        await queryRunner.query(`DROP TYPE "public"."diary_entries_meal_type_enum"`);
    }

}
