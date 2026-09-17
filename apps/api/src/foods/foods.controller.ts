import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { SearchFoodsQueryDto } from './dto/search-foods-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';

@ApiTags('foods')
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um alimento personalizado (visível só pra quem cadastrou)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFoodDto) {
    return this.foodsService.create(user.sub, dto);
  }

  // Rota estática precisa vir antes de ':id' pro Nest não tentar casar
  // "search" como um :id.
  @Get('search')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Busca alimentos (trigram/unaccent local, com fallback pro Open Food Facts sob demanda)',
  })
  search(@CurrentUser() user: JwtPayload, @Query() query: SearchFoodsQueryDto) {
    return this.foodsService.search(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um alimento (TACO/OFF públicos, custom só pro dono)' })
  findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.foodsService.findById(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um alimento personalizado - só o dono pode editar' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateFoodDto) {
    return this.foodsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um alimento personalizado - só o dono pode remover' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.foodsService.remove(id, user.sub);
  }
}
