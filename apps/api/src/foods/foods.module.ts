import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from '../database/entities/food.entity';
import { FoodPortion } from '../database/entities/food-portion.entity';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { OpenFoodFactsClient } from './open-food-facts.client';
import { PortionsController } from './portions/portions.controller';
import { PortionsService } from './portions/portions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Food, FoodPortion])],
  controllers: [FoodsController, PortionsController],
  providers: [FoodsService, OpenFoodFactsClient, PortionsService],
  exports: [FoodsService],
})
export class FoodsModule {}
