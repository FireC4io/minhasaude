import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consent } from '../database/entities/consent.entity';
import { ConsentsModule } from '../consents/consents.module';
import { DiaryEntry } from '../database/entities/diary-entry.entity';
import { FoodPortion } from '../database/entities/food-portion.entity';
import { FoodsModule } from '../foods/foods.module';
import { GoalsModule } from '../goals/goals.module';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';

@Module({
  imports: [
    // Consent aqui porque RequireConsentGuard é usado via @UseGuards() no controller.
    TypeOrmModule.forFeature([DiaryEntry, FoodPortion, Consent]),
    ConsentsModule,
    FoodsModule,
    GoalsModule,
  ],
  controllers: [DiaryController],
  providers: [DiaryService],
  exports: [DiaryService],
})
export class DiaryModule {}
