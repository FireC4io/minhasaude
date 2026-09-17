import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConsentsAndAccountDeletion1789670528544 implements MigrationInterface {
    name = 'AddConsentsAndAccountDeletion1789670528544'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."consents_consent_type_enum" AS ENUM('terms_of_service', 'privacy_policy', 'exam_data_processing')`);
        await queryRunner.query(`CREATE TABLE "consents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "consent_type" "public"."consents_consent_type_enum" NOT NULL, "policy_version" character varying NOT NULL, "granted_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "ip_address" character varying, "user_agent" character varying, CONSTRAINT "PK_9efc68eb6aba7d638fb6ea034dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_946390b9024aba22cd1c162143" ON "consents"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "account_deletion_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "requested_at" TIMESTAMP WITH TIME ZONE NOT NULL, "scheduled_purge_at" TIMESTAMP WITH TIME ZONE NOT NULL, "completed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_8e4635073e7fe59498285d7dc44" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_741b76f2bbc0cc65281abb0828" ON "account_deletion_requests"  ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_741b76f2bbc0cc65281abb0828"`);
        await queryRunner.query(`DROP TABLE "account_deletion_requests"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_946390b9024aba22cd1c162143"`);
        await queryRunner.query(`DROP TABLE "consents"`);
        await queryRunner.query(`DROP TYPE "public"."consents_consent_type_enum"`);
    }

}
