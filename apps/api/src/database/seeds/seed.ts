import 'dotenv/config';
import * as argon2 from 'argon2';
import AppDataSource from '../data-source';
import { User, UserStatus } from '../entities';

const SEED_EMAIL = 'teste@minhasaude.app';
const SEED_PASSWORD = 'Teste@123'; // dev only - nunca usar em produção

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email: SEED_EMAIL } });
  if (existing) {
    console.log(`Seed: usuário ${SEED_EMAIL} já existe, nada a fazer.`);
    await AppDataSource.destroy();
    return;
  }

  const passwordHash = await argon2.hash(SEED_PASSWORD);
  const user = userRepo.create({
    email: SEED_EMAIL,
    passwordHash,
    status: UserStatus.ACTIVE,
  });
  await userRepo.save(user);

  console.log(`Seed: usuário de teste criado - ${SEED_EMAIL} / senha: ${SEED_PASSWORD}`);
  await AppDataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error('Seed falhou:', error);
  process.exit(1);
});
