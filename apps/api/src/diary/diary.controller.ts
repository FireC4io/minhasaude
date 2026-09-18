import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DiaryService } from './diary.service';
import { CreateDiaryEntryDto } from './dto/create-diary-entry.dto';
import { UpdateDiaryEntryDto } from './dto/update-diary-entry.dto';
import { CopyDiaryDto } from './dto/copy-diary.dto';
import { GetDiaryQueryDto } from './dto/get-diary-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';

@ApiTags('diary')
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  @ApiOperation({ summary: 'Adiciona uma entrada ao diário alimentar' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateDiaryEntryDto) {
    return this.diaryService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Entradas do dia agrupadas por refeição + resumo (consumido/meta/restante)' })
  getByDate(@CurrentUser() user: JwtPayload, @Query() query: GetDiaryQueryDto) {
    return this.diaryService.getByDate(user.sub, query.date);
  }

  @Post('copy')
  @ApiOperation({ summary: 'Duplica todas as entradas de um dia pra outro' })
  copy(@CurrentUser() user: JwtPayload, @Body() dto: CopyDiaryDto) {
    return this.diaryService.copy(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma entrada do diário' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateDiaryEntryDto) {
    return this.diaryService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma entrada do diário' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.diaryService.remove(id, user.sub);
  }
}
