import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consent } from '../database/entities/consent.entity';
import { AuditModule } from '../audit/audit.module';
import { ConsentsController } from './consents.controller';
import { ConsentsService } from './consents.service';
import { RequireConsentGuard } from './guards/require-consent.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Consent]), AuditModule],
  controllers: [ConsentsController],
  providers: [ConsentsService, RequireConsentGuard],
  exports: [ConsentsService, RequireConsentGuard],
})
export class ConsentsModule {}
