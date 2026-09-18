import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryEntry } from '../database/entities/diary-entry.entity';
import { FoodPortion } from '../database/entities/food-portion.entity';
import { FoodsModule } from '../foods/foods.module';
import { GoalsModule } from '../goals/goals.module';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';

@Module({
  imports: [TypeOrmModule.forFeature([DiaryEntry, FoodPortion]), FoodsModule, GoalsModule],
  controllers: [DiaryController],
  providers: [DiaryService],
  exports: [DiaryService],
})
export class DiaryModule {}
