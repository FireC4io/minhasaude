import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodyMeasurement } from '../database/entities/body-measurement.entity';
import { Consent } from '../database/entities/consent.entity';
import { ConsentsModule } from '../consents/consents.module';
import { BodyMeasurementsController } from './body-measurements.controller';
import { BodyMeasurementsService } from './body-measurements.service';

@Module({
  imports: [
    // Consent também é registrado aqui porque RequireConsentGuard é usado via
    // @UseGuards() direto no controller - ver o mesmo padrão em UsersModule.
    TypeOrmModule.forFeature([BodyMeasurement, Consent]),
    ConsentsModule,
  ],
  controllers: [BodyMeasurementsController],
  providers: [BodyMeasurementsService],
  exports: [BodyMeasurementsService],
})
export class BodyMeasurementsModule {}
