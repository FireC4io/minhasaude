import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalTarget } from '../database/entities/goal-target.entity';
import { Profile } from '../database/entities/profile.entity';
import { BodyMeasurementsModule } from '../body-measurements/body-measurements.module';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [TypeOrmModule.forFeature([GoalTarget, Profile]), BodyMeasurementsModule],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
