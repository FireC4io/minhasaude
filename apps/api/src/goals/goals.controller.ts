import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { RecalculateGoalDto } from './dto/recalculate-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalTargetResponseDto } from './dto/goal-target-response.dto';
import { PaginatedGoalTargetResponseDto } from './dto/paginated-goal-target-response.dto';
import { toDto } from '../common/serialization/to-dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';

@ApiTags('goals')
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Meta ativa (TMB, TDEE, macros)' })
  @ApiOkResponse({ type: GoalTargetResponseDto })
  async getCurrent(@CurrentUser() user: JwtPayload) {
    return toDto(GoalTargetResponseDto, await this.goalsService.getCurrent(user.sub));
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Recalcula a meta a partir do perfil e da medida corporal mais recente' })
  @ApiOkResponse({ type: GoalTargetResponseDto })
  async recalculate(@CurrentUser() user: JwtPayload, @Body() dto: RecalculateGoalDto) {
    return toDto(GoalTargetResponseDto, await this.goalsService.recalculate(user.sub, dto));
  }

  @Patch('current')
  @ApiOperation({ summary: 'Ajuste manual de macros/calorias da meta ativa' })
  @ApiOkResponse({ type: GoalTargetResponseDto })
  async updateManual(@CurrentUser() user: JwtPayload, @Body() dto: UpdateGoalDto) {
    return toDto(GoalTargetResponseDto, await this.goalsService.updateManual(user.sub, dto));
  }

  @Get('history')
  @ApiOperation({ summary: 'Histórico paginado de metas' })
  @ApiOkResponse({ type: PaginatedGoalTargetResponseDto })
  async history(@CurrentUser() user: JwtPayload, @Query() query: PaginationQueryDto) {
    return toDto(PaginatedGoalTargetResponseDto, await this.goalsService.history(user.sub, query));
  }
}
