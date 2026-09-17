import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ConsentsService } from './consents.service';
import { GrantConsentDto } from './dto/grant-consent.dto';
import { ConsentType } from '../database/entities/consent.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';

@ApiTags('consents')
@Controller('consents')
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  @Get()
  @ApiOperation({ summary: 'Status atual de cada tipo de consentimento' })
  list(@CurrentUser() user: JwtPayload) {
    return this.consentsService.listStatus(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Registra o aceite de um consentimento' })
  grant(@CurrentUser() user: JwtPayload, @Body() dto: GrantConsentDto, @Req() req: Request) {
    const ip = req.ip ?? null;
    const userAgent = req.headers['user-agent'] ?? null;
    return this.consentsService.grant(user.sub, dto, ip, userAgent);
  }

  @Delete(':type')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga o consentimento ativo de um tipo' })
  async revoke(@CurrentUser() user: JwtPayload, @Param('type') type: ConsentType): Promise<void> {
    await this.consentsService.revoke(user.sub, type);
  }
}
