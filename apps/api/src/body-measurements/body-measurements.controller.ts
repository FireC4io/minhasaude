import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BodyMeasurementsService } from './body-measurements.service';
import { CreateBodyMeasurementDto } from './dto/create-body-measurement.dto';
import { ListBodyMeasurementsQueryDto } from './dto/list-body-measurements-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';
import { RequireConsent } from '../consents/decorators/require-consent.decorator';
import { RequireConsentGuard } from '../consents/guards/require-consent.guard';
import { ConsentType } from '../database/entities/consent.entity';

@ApiTags('body-measurements')
@Controller('body-measurements')
export class BodyMeasurementsController {
  constructor(private readonly bodyMeasurementsService: BodyMeasurementsService) {}

  @Post()
  @UseGuards(RequireConsentGuard)
  @RequireConsent(ConsentType.PRIVACY_POLICY)
  @ApiOperation({ summary: 'Registra uma medida corporal manual - exige consentimento com a política de privacidade' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBodyMeasurementDto) {
    return this.bodyMeasurementsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista medidas corporais do usuário, filtrável por fonte e período' })
  list(@CurrentUser() user: JwtPayload, @Query() query: ListBodyMeasurementsQueryDto) {
    return this.bodyMeasurementsService.list(user.sub, query);
  }
}
