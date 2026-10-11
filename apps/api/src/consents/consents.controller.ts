import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, ParseEnumPipe } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ConsentsService } from './consents.service';
import { GrantConsentDto } from './dto/grant-consent.dto';
import { ConsentResponseDto } from './dto/consent-response.dto';
import { ConsentStatusResponseDto } from './dto/consent-status-response.dto';
import { toDto, toDtoList } from '../common/serialization/to-dto';
import { ConsentType } from '../database/entities/consent.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';

@ApiTags('consents')
@Controller('consents')
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  @Get()
  @ApiOperation({ summary: 'Status atual de cada tipo de consentimento' })
  @ApiOkResponse({ type: ConsentStatusResponseDto, isArray: true })
  async list(@CurrentUser() user: JwtPayload): Promise<ConsentStatusResponseDto[]> {
    return toDtoList(ConsentStatusResponseDto, await this.consentsService.listStatus(user.sub));
  }

  @Post()
  @ApiOperation({ summary: 'Registra o aceite de um consentimento' })
  @ApiCreatedResponse({ type: ConsentResponseDto })
  async grant(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GrantConsentDto,
    @Req() req: Request,
  ): Promise<ConsentResponseDto> {
    const ip = req.ip ?? null;
    const userAgent = req.headers['user-agent'] ?? null;
    return toDto(ConsentResponseDto, await this.consentsService.grant(user.sub, dto, ip, userAgent));
  }

  @Delete(':type')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga o consentimento ativo de um tipo' })
  @ApiNoContentResponse()
  async revoke(@CurrentUser() user: JwtPayload, @Param('type', new ParseEnumPipe(ConsentType)) type: ConsentType): Promise<void> {
    await this.consentsService.revoke(user.sub, type);
  }
}
