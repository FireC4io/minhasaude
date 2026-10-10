import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consent } from '../database/entities/consent.entity';
import { ConsentsModule } from '../consents/consents.module';
import { GoalTarget } from '../database/entities/goal-target.entity';
import { Profile } from '../database/entities/profile.entity';
import { BodyMeasurementsModule } from '../body-measurements/body-measurements.module';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [
    // Consent aqui porque RequireConsentGuard é usado via @UseGuards() no controller.
    TypeOrmModule.forFeature([GoalTarget, Profile, Consent]),
    ConsentsModule,
    BodyMeasurementsModule,
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
