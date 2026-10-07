import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum FoodSource {
  TACO = 'taco',
  OFF = 'off',
  CUSTOM = 'custom',
}

// Alimentos de source=custom só são visíveis/editáveis pelo próprio
// owner_user_id (ver FoodsService) - sem busca compartilhada entre usuários
// no MVP (product-plan.md seção 2). TACO/OFF são públicos pra todo usuário
// autenticado, mas só editáveis via processo de import/cache, nunca por
// PATCH/DELETE direto do usuário.
@Entity('foods')
@Index(['barcode'])
// Índices criados à mão nas migrations (parcial e GIN, que o decorator não
// expressa). `synchronize: false` faz o migration:generate ignorá-los em vez
// de gerar DROP INDEX — aconteceu na AddWeeklyPace.
@Index('IDX_foods_source_external_id', { synchronize: false })
@Index('IDX_foods_search_vector', { synchronize: false })
export class Food extends BaseEntity {
  @Column({ type: 'enum', enum: FoodSource })
  source!: FoodSource;

  // Código do produto na fonte externa (ex. código de barras do OFF) - nulo
  // pra TACO/custom.
  @Column({ type: 'varchar', name: 'external_id', nullable: true })
  externalId!: string | null;

  @Index()
  @Column({ type: 'uuid', name: 'owner_user_id', nullable: true })
  ownerUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser!: User | null;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  brand!: string | null;

  @Column({ type: 'varchar', nullable: true })
  barcode!: string | null;

  @Column({ type: 'numeric', name: 'kcal_per_100g', precision: 7, scale: 2 })
  kcalPer100g!: string;

  @Column({ type: 'numeric', name: 'protein_g_per_100g', precision: 6, scale: 2 })
  proteinGPer100g!: string;

  @Column({ type: 'numeric', name: 'fat_g_per_100g', precision: 6, scale: 2 })
  fatGPer100g!: string;

  @Column({ type: 'numeric', name: 'carb_g_per_100g', precision: 6, scale: 2 })
  carbGPer100g!: string;

  @Column({ type: 'numeric', name: 'fiber_g_per_100g', precision: 6, scale: 2, nullable: true })
  fiberGPer100g!: string | null;

  // Micronutrientes por 100 g (chaves de `MICRONUTRIENTS` do shared, inclusive
  // fibras, que também segue na coluna acima). Chave ausente ou null = a fonte
  // não mediu — nunca zero inventado. Ler sempre via `foodMicrosPer100g`.
  @Column({ type: 'jsonb', name: 'micros_per_100g', nullable: true })
  microsPer100g!: Partial<Record<string, number | null>> | null;

  // Coluna gerada (STORED) pra full-text search - ver ADR-0004. unaccent()
  // não entra aqui porque não é IMMUTABLE (Postgres recusa gerar a coluna);
  // o fuzzy/tolerância a acento fica a cargo do índice trigram em `name`
  // (issue #14), criado via SQL bruto na migration.
  @Column({
    type: 'tsvector',
    name: 'search_vector',
    asExpression: `to_tsvector('portuguese', coalesce(name, ''))`,
    generatedType: 'STORED',
    select: false,
  })
  searchVector!: string;
}
