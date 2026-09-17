import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoalTargets1789673800000 implements MigrationInterface {
    name = 'AddGoalTargets1789673800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."goal_targets_calculation_method_enum" AS ENUM('mifflin_st_jeor', 'katch_mcardle')`);
        await queryRunner.query(`CREATE TABLE "goal_targets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "profile_snapshot" jsonb NOT NULL, "calculation_method" "public"."goal_targets_calculation_method_enum" NOT NULL, "bmr_kcal" numeric(7,2) NOT NULL, "tdee_kcal" numeric(7,2) NOT NULL, "target_kcal" numeric(7,2) NOT NULL, "protein_g" numeric(6,2) NOT NULL, "fat_g" numeric(6,2) NOT NULL, "carb_g" numeric(6,2) NOT NULL, "is_manual_override" boolean NOT NULL DEFAULT false, "active_from" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_7d420cea9e5d2f633f944be92b2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c67d777f46bd57212b5caaf295" ON "goal_targets"  ("user_id") `);
        await queryRunner.query(`ALTER TABLE "goal_targets" ADD CONSTRAINT "FK_c67d777f46bd57212b5caaf295a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "goal_targets" DROP CONSTRAINT "FK_c67d777f46bd57212b5caaf295a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c67d777f46bd57212b5caaf295"`);
        await queryRunner.query(`DROP TABLE "goal_targets"`);
        await queryRunner.query(`DROP TYPE "public"."goal_targets_calculation_method_enum"`);
    }

}
