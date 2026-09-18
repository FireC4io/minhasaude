import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiaryEntry, MealType, DiaryQuantityUnit } from '../database/entities/diary-entry.entity';
import { FoodPortion } from '../database/entities/food-portion.entity';
import { FoodsService } from '../foods/foods.service';
import { GoalsService } from '../goals/goals.service';
import type { CreateDiaryEntryDto } from './dto/create-diary-entry.dto';
import type { UpdateDiaryEntryDto } from './dto/update-diary-entry.dto';
import type { CopyDiaryDto } from './dto/copy-diary.dto';

interface MacroTotals {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
}

export interface DailySummary {
  date: string;
  meals: Record<MealType, DiaryEntry[]>;
  summary: {
    consumed: MacroTotals;
    target: MacroTotals | null;
    remaining: MacroTotals | null;
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class DiaryService {
  constructor(
    @InjectRepository(DiaryEntry) private readonly entries: Repository<DiaryEntry>,
    @InjectRepository(FoodPortion) private readonly portions: Repository<FoodPortion>,
    private readonly foodsService: FoodsService,
    private readonly goalsService: GoalsService,
  ) {}

  // Congela o valor nutricional no momento do registro (ver CLAUDE.md) - só
  // aceita alimentos visíveis ao usuário (TACO/OFF públicos ou custom
  // próprio), reusando a mesma regra de visibilidade do FoodsService.
  private async computeSnapshot(
    userId: string,
    foodId: string,
    quantity: number,
    unit: DiaryQuantityUnit,
    portionId: string | null,
  ): Promise<MacroTotals & { grams: number }> {
    const food = await this.foodsService.findById(foodId, userId);

    let grams: number;
    if (unit === DiaryQuantityUnit.GRAMS) {
      grams = quantity;
    } else {
      if (!portionId) {
        throw new BadRequestException('portionId é obrigatório quando unit=portion.');
      }
      const portion = await this.portions.findOne({ where: { id: portionId } });
      if (!portion || portion.foodId !== foodId) {
        throw new BadRequestException('Porção inválida para este alimento.');
      }
      grams = quantity * Number(portion.grams);
    }

    const multiplier = grams / 100;
    return {
      kcal: round2(Number(food.kcalPer100g) * multiplier),
      proteinG: round2(Number(food.proteinGPer100g) * multiplier),
      fatG: round2(Number(food.fatGPer100g) * multiplier),
      carbG: round2(Number(food.carbGPer100g) * multiplier),
      grams,
    };
  }

  async create(userId: string, dto: CreateDiaryEntryDto): Promise<DiaryEntry> {
    const portionId = dto.unit === DiaryQuantityUnit.GRAMS ? null : (dto.portionId ?? null);
    const snap = await this.computeSnapshot(userId, dto.foodId, dto.quantity, dto.unit, portionId);

    const entry = this.entries.create({
      userId,
      foodId: dto.foodId,
      entryDate: dto.date,
      mealType: dto.mealType,
      quantity: dto.quantity.toString(),
      unit: dto.unit,
      portionId,
      kcalSnapshot: snap.kcal.toString(),
      proteinGSnapshot: snap.proteinG.toString(),
      fatGSnapshot: snap.fatG.toString(),
      carbGSnapshot: snap.carbG.toString(),
    });
    return this.entries.save(entry);
  }

  async update(id: string, userId: string, dto: UpdateDiaryEntryDto): Promise<DiaryEntry> {
    const entry = await this.findOwnedOrThrow(id, userId);

    const foodId = dto.foodId ?? entry.foodId;
    const quantity = dto.quantity ?? Number(entry.quantity);
    const unit = dto.unit ?? entry.unit;
    // Trocar pra grams sempre limpa a porção - não faz sentido manter uma
    // portionId associada a uma entrada medida em gramas.
    const portionId = unit === DiaryQuantityUnit.GRAMS ? null : (dto.portionId ?? entry.portionId);

    const nutritionChanged =
      dto.foodId !== undefined || dto.quantity !== undefined || dto.unit !== undefined || dto.portionId !== undefined;

    if (nutritionChanged) {
      const snap = await this.computeSnapshot(userId, foodId, quantity, unit, portionId);
      entry.kcalSnapshot = snap.kcal.toString();
      entry.proteinGSnapshot = snap.proteinG.toString();
      entry.fatGSnapshot = snap.fatG.toString();
      entry.carbGSnapshot = snap.carbG.toString();
    }

    entry.foodId = foodId;
    entry.quantity = quantity.toString();
    entry.unit = unit;
    entry.portionId = portionId;
    if (dto.mealType !== undefined) entry.mealType = dto.mealType;
    if (dto.date !== undefined) entry.entryDate = dto.date;

    return this.entries.save(entry);
  }

  async remove(id: string, userId: string): Promise<void> {
    const entry = await this.findOwnedOrThrow(id, userId);
    await this.entries.remove(entry);
  }

  private async findOwnedOrThrow(id: string, userId: string): Promise<DiaryEntry> {
    const entry = await this.entries.findOne({ where: { id } });
    if (!entry || entry.userId !== userId) {
      throw new NotFoundException('Entrada de diário não encontrada.');
    }
    return entry;
  }

  async getByDate(userId: string, date: string): Promise<DailySummary> {
    const dayEntries = await this.entries.find({
      where: { userId, entryDate: date },
      order: { createdAt: 'ASC' },
    });

    const meals: Record<MealType, DiaryEntry[]> = {
      [MealType.BREAKFAST]: [],
      [MealType.LUNCH]: [],
      [MealType.DINNER]: [],
      [MealType.SNACK]: [],
    };
    for (const entry of dayEntries) {
      meals[entry.mealType].push(entry);
    }

    const consumed = dayEntries.reduce<MacroTotals>(
      (acc, e) => ({
        kcal: acc.kcal + Number(e.kcalSnapshot),
        proteinG: acc.proteinG + Number(e.proteinGSnapshot),
        fatG: acc.fatG + Number(e.fatGSnapshot),
        carbG: acc.carbG + Number(e.carbGSnapshot),
      }),
      { kcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
    );
    const roundedConsumed: MacroTotals = {
      kcal: round2(consumed.kcal),
      proteinG: round2(consumed.proteinG),
      fatG: round2(consumed.fatG),
      carbG: round2(consumed.carbG),
    };

    // Sem meta calculada ainda é um estado válido - o resumo funciona só com
    // o consumido, sem target/remaining.
    let target: MacroTotals | null = null;
    try {
      const goal = await this.goalsService.getCurrent(userId);
      target = {
        kcal: Number(goal.targetKcal),
        proteinG: Number(goal.proteinG),
        fatG: Number(goal.fatG),
        carbG: Number(goal.carbG),
      };
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
    }

    const remaining: MacroTotals | null = target && {
      kcal: round2(target.kcal - roundedConsumed.kcal),
      proteinG: round2(target.proteinG - roundedConsumed.proteinG),
      fatG: round2(target.fatG - roundedConsumed.fatG),
      carbG: round2(target.carbG - roundedConsumed.carbG),
    };

    return { date, meals, summary: { consumed: roundedConsumed, target, remaining } };
  }

  // Recalcula o snapshot a partir do alimento atual no momento da cópia -
  // é uma entrada nova, não uma correção retroativa da entrada de origem.
  async copy(userId: string, dto: CopyDiaryDto): Promise<DiaryEntry[]> {
    const sourceEntries = await this.entries.find({ where: { userId, entryDate: dto.fromDate } });

    const created: DiaryEntry[] = [];
    for (const source of sourceEntries) {
      const snap = await this.computeSnapshot(
        userId,
        source.foodId,
        Number(source.quantity),
        source.unit,
        source.portionId,
      );
      const entry = this.entries.create({
        userId,
        foodId: source.foodId,
        entryDate: dto.toDate,
        mealType: source.mealType,
        quantity: source.quantity,
        unit: source.unit,
        portionId: source.portionId,
        kcalSnapshot: snap.kcal.toString(),
        proteinGSnapshot: snap.proteinG.toString(),
        fatGSnapshot: snap.fatG.toString(),
        carbGSnapshot: snap.carbG.toString(),
      });
      created.push(await this.entries.save(entry));
    }
    return created;
  }

  // Usado por GET /v1/me/export - histórico completo, não só um dia.
  async listAll(userId: string): Promise<DiaryEntry[]> {
    return this.entries.find({ where: { userId }, order: { entryDate: 'DESC', createdAt: 'ASC' } });
  }
}
