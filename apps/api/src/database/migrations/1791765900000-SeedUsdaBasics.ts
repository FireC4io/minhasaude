import { MigrationInterface, QueryRunner } from 'typeorm';
import { insertUsdaBasics } from '../seeds/insert-catalog';

/**
 * Carrega os básicos do dia a dia que a TACO não tem (leite de vaca, macarrão
 * cozido, pão de forma branco, salsicha, pizza...), com os números do USDA e
 * as medidas caseiras dele. Lista revisada pelo dono; regras em
 * `docs/dados/alimentos-usda.md`.
 */
export class SeedUsdaBasics1791765900000 implements MigrationInterface {
  name = 'SeedUsdaBasics1791765900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertUsdaBasics(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "foods" f WHERE f."source" = 'usda'
         AND NOT EXISTS (SELECT 1 FROM "diary_entries" d WHERE d."food_id" = f."id")`,
    );
  }
}
