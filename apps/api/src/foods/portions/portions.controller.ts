import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { toDto, toDtoList } from '../../common/serialization/to-dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.interface';
import { PortionsService } from './portions.service';
import { CreatePortionDto } from './dto/create-portion.dto';
import { PortionResponseDto } from './dto/portion-response.dto';

@ApiTags('foods')
@Controller()
export class PortionsController {
  constructor(private readonly portionsService: PortionsService) {}

  @Get('foods/:id/portions')
  @ApiOperation({ summary: 'Medidas caseiras do alimento: as do sistema (IBGE) e as criadas pela pessoa' })
  @ApiOkResponse({ type: PortionResponseDto, isArray: true })
  async list(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) foodId: string) {
    return toDtoList(PortionResponseDto, await this.portionsService.list(foodId, user.sub));
  }

  @Post('foods/:id/portions')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cria uma medida própria ("minha caneca = 180 g"), visível só pra quem criou' })
  @ApiCreatedResponse({ type: PortionResponseDto })
  async create(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) foodId: string,
    @Body() dto: CreatePortionDto,
  ) {
    return toDto(PortionResponseDto, await this.portionsService.create(foodId, user.sub, dto));
  }

  @Delete('portions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Apaga uma medida própria; anotações que a usavam passam para gramas' })
  @ApiNoContentResponse()
  async remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.portionsService.remove(id, user.sub);
  }
}
