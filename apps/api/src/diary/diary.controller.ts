import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DiaryService } from './diary.service';
import { CreateDiaryEntryDto } from './dto/create-diary-entry.dto';
import { UpdateDiaryEntryDto } from './dto/update-diary-entry.dto';
import { CopyDiaryDto } from './dto/copy-diary.dto';
import { GetDiaryQueryDto } from './dto/get-diary-query.dto';
import { DiaryEntryResponseDto } from './dto/diary-entry-response.dto';
import { DailySummaryResponseDto } from './dto/daily-summary-response.dto';
import { toDto, toDtoList } from '../common/serialization/to-dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';

@ApiTags('diary')
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  @ApiOperation({ summary: 'Adiciona uma entrada ao diário alimentar' })
  @ApiCreatedResponse({ type: DiaryEntryResponseDto })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateDiaryEntryDto) {
    return toDto(DiaryEntryResponseDto, await this.diaryService.create(user.sub, dto));
  }

  @Get()
  @ApiOperation({ summary: 'Entradas do dia agrupadas por refeição + resumo (consumido/meta/restante)' })
  @ApiOkResponse({ type: DailySummaryResponseDto })
  async getByDate(@CurrentUser() user: JwtPayload, @Query() query: GetDiaryQueryDto) {
    return toDto(DailySummaryResponseDto, await this.diaryService.getByDate(user.sub, query.date));
  }

  @Post('copy')
  @ApiOperation({ summary: 'Duplica todas as entradas de um dia pra outro' })
  @ApiOkResponse({ type: [DiaryEntryResponseDto] })
  async copy(@CurrentUser() user: JwtPayload, @Body() dto: CopyDiaryDto) {
    return toDtoList(DiaryEntryResponseDto, await this.diaryService.copy(user.sub, dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma entrada do diário' })
  @ApiOkResponse({ type: DiaryEntryResponseDto })
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateDiaryEntryDto) {
    return toDto(DiaryEntryResponseDto, await this.diaryService.update(id, user.sub, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma entrada do diário' })
  @ApiNoContentResponse()
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.diaryService.remove(id, user.sub);
  }
}
