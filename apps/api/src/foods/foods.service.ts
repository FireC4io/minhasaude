import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Food, FoodSource } from '../database/entities/food.entity';
import { OpenFoodFactsClient, type OffProduct } from './open-food-facts.client';
import type { CreateFoodDto } from './dto/create-food.dto';
import type { UpdateFoodDto } from './dto/update-food.dto';
import type { SearchFoodsQueryDto } from './dto/search-foods-query.dto';
import type { PaginatedResult } from '../common/types/paginated-result.interface';
import { buildSearchTerms, type SearchTerms } from './search/search-terms';
import { buildFoodSearchQuery } from './search/food-search.query';

@Injectable()
export class FoodsService {
  constructor(
    @InjectRepository(Food) private readonly foods: Repository<Food>,
    private readonly openFoodFacts: OpenFoodFactsClient,
  ) {}

  async create(userId: string, dto: CreateFoodDto): Promise<Food> {
    const food = this.foods.create({
      source: FoodSource.CUSTOM,
      ownerUserId: userId,
      externalId: null,
      name: dto.name,
      brand: dto.brand ?? null,
      barcode: dto.barcode ?? null,
      kcalPer100g: dto.kcalPer100g.toString(),
      proteinGPer100g: dto.proteinGPer100g.toString(),
      fatGPer100g: dto.fatGPer100g.toString(),
      carbGPer100g: dto.carbGPer100g.toString(),
      fiberGPer100g: dto.fiberGPer100g !== undefined ? dto.fiberGPer100g.toString() : null,
    });
    return this.foods.save(food);
  }

  // TACO/OFF são públicos pra qualquer usuário autenticado; um alimento
  // custom só é visível pro próprio owner - ver CLAUDE.md/product-plan.md.
  async findById(id: string, userId: string): Promise<Food> {
    const food = await this.foods.findOne({ where: { id } });
    if (!food || (food.source === FoodSource.CUSTOM && food.ownerUserId !== userId)) {
      throw new NotFoundException('Alimento não encontrado.');
    }
    return food;
  }

  async update(id: string, userId: string, dto: UpdateFoodDto): Promise<Food> {
    const food = await this.findOwnedOrThrow(id, userId);
    Object.assign(food, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.brand !== undefined && { brand: dto.brand }),
      ...(dto.barcode !== undefined && { barcode: dto.barcode }),
      ...(dto.kcalPer100g !== undefined && { kcalPer100g: dto.kcalPer100g.toString() }),
      ...(dto.proteinGPer100g !== undefined && { proteinGPer100g: dto.proteinGPer100g.toString() }),
      ...(dto.fatGPer100g !== undefined && { fatGPer100g: dto.fatGPer100g.toString() }),
      ...(dto.carbGPer100g !== undefined && { carbGPer100g: dto.carbGPer100g.toString() }),
      ...(dto.fiberGPer100g !== undefined && { fiberGPer100g: dto.fiberGPer100g.toString() }),
    });
    return this.foods.save(food);
  }

  async remove(id: string, userId: string): Promise<void> {
    const food = await this.findOwnedOrThrow(id, userId);
    await this.foods.remove(food);
  }

  // Alimentos do sistema (owner_user_id nulo) e de outros usuários caem no
  // mesmo 404 - nunca revela se um alimento existe pra quem não pode editá-lo.
  private async findOwnedOrThrow(id: string, userId: string): Promise<Food> {
    const food = await this.foods.findOne({ where: { id } });
    if (!food || food.ownerUserId !== userId) {
      throw new NotFoundException('Alimento não encontrado ou você não tem permissão para editá-lo.');
    }
    return food;
  }

  // Trigram + unaccent sobre foods.name (ver ADR-0004). Só alimentos
  // públicos (TACO/OFF) + os custom do próprio usuário entram na busca -
  // sem busca compartilhada entre usuários (product-plan.md seção 2).
  async search(userId: string, query: SearchFoodsQueryDto): Promise<PaginatedResult<Food>> {
    const terms = buildSearchTerms(query.q);
    if (terms.query.length < 2) {
      // Só pontuação ("!!"): nada para buscar, nem no Open Food Facts.
      return { data: [], meta: { total: 0, page: query.page, limit: query.limit } };
    }

    const local = await this.searchLocal(userId, terms, query.page, query.limit);
    if (local.meta.total > 0) {
      return local;
    }

    // Nada localmente: tenta cachear resultados do Open Food Facts e
    // devolve a partir do que acabou de ser salvo. Buscas seguintes pelo
    // mesmo termo encontram os itens já cacheados na busca local acima, sem
    // nova chamada externa.
    const cached = await this.fetchAndCacheFromOpenFoodFacts(query.q);
    return { data: cached, meta: { total: cached.length, page: 1, limit: query.limit } };
  }

  private async searchLocal(
    userId: string,
    terms: SearchTerms,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Food>> {
    const { sql, params } = buildFoodSearchQuery(userId, terms, page, limit);
    const rows: { id: string; total: number }[] = await this.foods.query(sql, params);
    const total = rows[0]?.total ?? (page > 1 ? await this.countLocal(userId, terms.query) : 0);

    // A ordem é a do SQL; o `findBy` só hidrata as entidades.
    const byId = new Map(
      (rows.length ? await this.foods.findBy({ id: In(rows.map((r) => r.id)) }) : []).map((f) => [f.id, f]),
    );
    const data = rows.map((r) => byId.get(r.id)).filter((f): f is Food => f !== undefined);

    return { data, meta: { total, page, limit } };
  }

  // Página além do fim não traz linha nenhuma, e com ela some o total da
  // janela. Sem isso, o total viria 0 e a busca cairia no Open Food Facts.
  private async countLocal(userId: string, query: string): Promise<number> {
    return this.foods
      .createQueryBuilder('food')
      .where('(food.source != :custom OR food.owner_user_id = :userId)', {
        custom: FoodSource.CUSTOM,
        userId,
      })
      .andWhere('(:q)::text <% immutable_unaccent(lower(food.name))', { q: query })
      .getCount();
  }

  private async fetchAndCacheFromOpenFoodFacts(query: string): Promise<Food[]> {
    const products = await this.openFoodFacts.searchByTerm(query);
    const cached: Food[] = [];
    for (const product of products) {
      const food = await this.cacheOffProduct(product);
      if (food) cached.push(food);
    }
    return cached;
  }

  // Nunca fabrica um valor pra macro que o OFF não tem medido - mesma
  // política de dado aplicada ao import da TACO (issue #13).
  private async cacheOffProduct(product: OffProduct): Promise<Food | null> {
    const code = product.code?.trim();
    const name = product.product_name?.trim();
    if (!code || !name) return null;

    const existing = await this.foods.findOne({ where: { source: FoodSource.OFF, externalId: code } });
    if (existing) return existing;

    const n = product.nutriments;
    const kcal = n?.['energy-kcal_100g'];
    const protein = n?.proteins_100g;
    const fat = n?.fat_100g;
    const carb = n?.carbohydrates_100g;
    if (kcal === undefined || protein === undefined || fat === undefined || carb === undefined) {
      return null;
    }

    const food = this.foods.create({
      source: FoodSource.OFF,
      externalId: code,
      ownerUserId: null,
      name,
      brand: product.brands?.trim() || null,
      barcode: code,
      kcalPer100g: kcal.toString(),
      proteinGPer100g: protein.toString(),
      fatGPer100g: fat.toString(),
      carbGPer100g: carb.toString(),
      fiberGPer100g: n?.fiber_100g !== undefined ? n.fiber_100g.toString() : null,
      microsPer100g: offMicros(n),
    });
    return this.foods.save(food);
  }
}

const GRAMS_TO_MG = 1000;
const gToMg = (value: number | undefined): number | null =>
  value === undefined || !Number.isFinite(value) ? null : Math.round(value * GRAMS_TO_MG * 100) / 100;

// O OFF guarda minerais em gramas; aqui tudo vira mg, como na TACO. Vitamina A
// fica de fora: a unidade no OFF varia por produto (UI, µg, RE) e um número
// errado seria pior que "sem dado".
function offMicros(n: OffProduct['nutriments']): Record<string, number | null> {
  return {
    fiberG: n?.fiber_100g ?? null,
    sodiumMg: gToMg(n?.sodium_100g),
    potassiumMg: gToMg(n?.potassium_100g),
    calciumMg: gToMg(n?.calcium_100g),
    ironMg: gToMg(n?.iron_100g),
    magnesiumMg: gToMg(n?.magnesium_100g),
    zincMg: gToMg(n?.zinc_100g),
    vitaminCMg: gToMg(n?.['vitamin-c_100g']),
    vitaminARaeMcg: null,
  };
}
