import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BodyMeasurementsService } from './body-measurements.service';
import { BodyMeasurementResponseDto } from './dto/body-measurement-response.dto';
import { CreateBodyMeasurementDto } from './dto/create-body-measurement.dto';
import { ListBodyMeasurementsQueryDto } from './dto/list-body-measurements-query.dto';
import { PaginatedBodyMeasurementResponseDto } from './dto/paginated-body-measurement-response.dto';
import { toDto } from '../common/serialization/to-dto';
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
  @ApiCreatedResponse({ type: BodyMeasurementResponseDto })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBodyMeasurementDto) {
    return toDto(BodyMeasurementResponseDto, await this.bodyMeasurementsService.create(user.sub, dto));
  }

  @Get()
  @ApiOperation({ summary: 'Lista medidas corporais do usuário, filtrável por fonte e período' })
  @ApiOkResponse({ type: PaginatedBodyMeasurementResponseDto })
  async list(@CurrentUser() user: JwtPayload, @Query() query: ListBodyMeasurementsQueryDto) {
    return toDto(
      PaginatedBodyMeasurementResponseDto,
      await this.bodyMeasurementsService.list(user.sub, query),
    );
  }
}
