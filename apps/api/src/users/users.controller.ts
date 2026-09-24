import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MeResponseDto, ProfileResponseDto } from './dto/me-response.dto';
import { toDto } from '../common/serialization/to-dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';
import { RequireConsent } from '../consents/decorators/require-consent.decorator';
import { RequireConsentGuard } from '../consents/guards/require-consent.guard';
import { ConsentType } from '../database/entities/consent.entity';

@ApiTags('me')
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Dados da conta autenticada + perfil' })
  @ApiOkResponse({ type: MeResponseDto })
  async getMe(@CurrentUser() user: JwtPayload) {
    return toDto(MeResponseDto, await this.usersService.getMe(user.sub));
  }

  @Patch('profile')
  @UseGuards(RequireConsentGuard)
  @RequireConsent(ConsentType.PRIVACY_POLICY)
  @ApiOperation({ summary: 'Cria/atualiza o perfil - exige consentimento com a política de privacidade' })
  @ApiOkResponse({ type: ProfileResponseDto })
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return toDto(ProfileResponseDto, await this.usersService.updateProfile(user.sub, dto));
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporta todos os dados do usuário (LGPD, direito de portabilidade)' })
  exportData(@CurrentUser() user: JwtPayload) {
    return this.usersService.exportData(user.sub);
  }

  @Delete()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Inicia a exclusão da conta (LGPD, direito ao esquecimento)' })
  requestDeletion(@CurrentUser() user: JwtPayload) {
    return this.usersService.requestDeletion(user.sub);
  }
}
