import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
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
