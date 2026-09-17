import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from '../database/entities/food.entity';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { OpenFoodFactsClient } from './open-food-facts.client';

@Module({
  imports: [TypeOrmModule.forFeature([Food])],
  controllers: [FoodsController],
  providers: [FoodsService, OpenFoodFactsClient],
  exports: [FoodsService],
})
export class FoodsModule {}
