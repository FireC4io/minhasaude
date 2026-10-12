import { MigrationInterface, QueryRunner } from 'typeorm';
import { insertMissingTacoFoods, insertTacoPortions } from '../seeds/insert-catalog';

/**
 * Óleos e azeites da TACO (8 itens) entram no banco: o leitor passou a aceitar
 * gordura pura com proteína e carboidrato zero (ver `taco-catalog.ts`). Junto,
 * as medidas do IBGE deles (colher de sopa, chá, sobremesa).
 */
export class AddTacoPureFats1791765700000 implements MigrationInterface {
  name = 'AddTacoPureFats1791765700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertMissingTacoFoods(queryRunner);
    await insertTacoPortions(queryRunner);
  }

  // Só sai o que nenhuma anotação usa: apagar um alimento anotado quebraria o diário.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "foods" f WHERE f."source" = 'taco' AND f."fat_g_per_100g" >= 99.5
         AND NOT EXISTS (SELECT 1 FROM "diary_entries" d WHERE d."food_id" = f."id")`,
    );
  }
}
