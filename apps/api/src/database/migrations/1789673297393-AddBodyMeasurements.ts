import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBodyMeasurements1789673297393 implements MigrationInterface {
    name = 'AddBodyMeasurements1789673297393'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."body_measurements_source_enum" AS ENUM('manual', 'inbody', 'tanita', 'omron', 'other')`);
        await queryRunner.query(`CREATE TABLE "body_measurements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "measured_at" TIMESTAMP WITH TIME ZONE NOT NULL, "source" "public"."body_measurements_source_enum" NOT NULL, "weight_kg" numeric(5,2) NOT NULL, "body_fat_percent" numeric(4,1), "muscle_mass_kg" numeric(5,2), "lean_mass_kg" numeric(5,2), "raw_payload" jsonb, CONSTRAINT "PK_474282e620ea0cd4fe5d8cbce0f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_60c6f60b730f556932709f6b0b" ON "body_measurements"  ("user_id") `);
        await queryRunner.query(`ALTER TABLE "body_measurements" ADD CONSTRAINT "FK_60c6f60b730f556932709f6b0b7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "body_measurements" DROP CONSTRAINT "FK_60c6f60b730f556932709f6b0b7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60c6f60b730f556932709f6b0b"`);
        await queryRunner.query(`DROP TABLE "body_measurements"`);
        await queryRunner.query(`DROP TYPE "public"."body_measurements_source_enum"`);
    }

}
