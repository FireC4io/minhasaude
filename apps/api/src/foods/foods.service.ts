import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Food, FoodSource } from '../database/entities/food.entity';
import type { CreateFoodDto } from './dto/create-food.dto';
import type { UpdateFoodDto } from './dto/update-food.dto';

@Injectable()
export class FoodsService {
  constructor(@InjectRepository(Food) private readonly foods: Repository<Food>) {}

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
}
