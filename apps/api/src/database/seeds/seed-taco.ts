import 'dotenv/config';
import AppDataSource from '../data-source';
import { Food, FoodSource } from '../entities';
import { TACO_CSV_PATH, readTacoRows } from './taco-catalog';

// Reexecutar: `pnpm --filter @minhasaude/api seed:taco` - idempotente, ignora
// itens cujo external_id já foi importado. Em produção a TACO entra pela
// migration `SeedTacoFoods`, aplicada no boot.
async function seedTaco(): Promise<void> {
  const { rows, skipped } = readTacoRows(TACO_CSV_PATH);
  console.log(`Seed TACO: ${rows.length} itens válidos, ${skipped.length} ignorados por falta de macro obrigatório.`);

  await AppDataSource.initialize();
  const foods = AppDataSource.getRepository(Food);

  let created = 0;
  let alreadyExisted = 0;
  for (const row of rows) {
    const existing = await foods.findOne({ where: { source: FoodSource.TACO, externalId: row.externalId } });
    if (existing) {
      alreadyExisted++;
      continue;
    }
    const food = foods.create({
      source: FoodSource.TACO,
      externalId: row.externalId,
      ownerUserId: null,
      name: row.name,
      brand: null,
      barcode: null,
      kcalPer100g: row.kcalPer100g.toString(),
      proteinGPer100g: row.proteinGPer100g.toString(),
      fatGPer100g: row.fatGPer100g.toString(),
      carbGPer100g: row.carbGPer100g.toString(),
      fiberGPer100g: row.fiberGPer100g !== null ? row.fiberGPer100g.toString() : null,
    });
    await foods.save(food);
    created++;
  }

  console.log(`Seed TACO: ${created} alimentos criados, ${alreadyExisted} já existiam (idempotente).`);
  if (skipped.length > 0) {
    console.log('Itens ignorados:');
    for (const s of skipped) console.log(`  - ${s}`);
  }
  await AppDataSource.destroy();
}

seedTaco().catch((error: unknown) => {
  console.error('Seed TACO falhou:', error);
  process.exit(1);
});
