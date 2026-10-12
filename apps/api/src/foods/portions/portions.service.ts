import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { PORTION_KINDS, PORTION_LIMITS } from '@minhasaude/shared';
import { FoodPortion } from '../../database/entities/food-portion.entity';
import { FoodsService } from '../foods.service';
import type { CreatePortionDto } from './dto/create-portion.dto';

const KIND_ORDER = new Map<string, number>(PORTION_KINDS.map((kind, index) => [kind, index]));

function displayOrder(a: FoodPortion, b: FoodPortion): number {
  const ka = a.kind ? (KIND_ORDER.get(a.kind) ?? 0) : PORTION_KINDS.length;
  const kb = b.kind ? (KIND_ORDER.get(b.kind) ?? 0) : PORTION_KINDS.length;
  return ka - kb || a.createdAt.getTime() - b.createdAt.getTime();
}

@Injectable()
export class PortionsService {
  constructor(
    @InjectRepository(FoodPortion) private readonly portions: Repository<FoodPortion>,
    private readonly foodsService: FoodsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Medidas do sistema + as criadas pela pessoa, nunca as de outra pessoa. */
  async list(foodId: string, userId: string): Promise<FoodPortion[]> {
    await this.foodsService.findById(foodId, userId);
    const found = await this.portions.find({
      where: [
        { foodId, userId: IsNull() },
        { foodId, userId },
      ],
    });
    return [...found].sort(displayOrder);
  }

  async create(foodId: string, userId: string, dto: CreatePortionDto): Promise<FoodPortion> {
    await this.foodsService.findById(foodId, userId);
    const existing = await this.portions.count({ where: { foodId, userId } });
    if (existing >= PORTION_LIMITS.customPerFood) {
      throw new BadRequestException(`Limite de ${PORTION_LIMITS.customPerFood} medidas por alimento.`);
    }
    return this.portions.save(
      this.portions.create({ foodId, userId, kind: null, label: dto.label.trim(), grams: dto.grams.toFixed(2) }),
    );
  }

  /**
   * Apaga uma medida da pessoa. As anotações que a usavam passam a ficar em
   * gramas (mesma quantidade de comida, mesmo snapshot nutricional) — sem
   * isso, o `ON DELETE SET NULL` deixaria "2 porções" de nada.
   */
  async remove(id: string, userId: string): Promise<void> {
    const portion = await this.portions.findOne({ where: { id, userId } });
    if (!portion) throw new NotFoundException('Medida não encontrada.');

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `UPDATE "diary_entries" d SET "quantity" = ROUND(d."quantity" * p."grams", 2), "unit" = 'grams', "portion_id" = NULL
           FROM "food_portions" p
          WHERE p."id" = $1 AND d."portion_id" = p."id" AND d."user_id" = $2`,
        [id, userId],
      );
      await manager.remove(portion);
    });
  }
}
