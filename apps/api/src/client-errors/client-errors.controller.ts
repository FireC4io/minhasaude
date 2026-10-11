import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { ReportClientErrorDto } from './dto/report-client-error.dto';
import { scrub } from './scrub';

/**
 * Erros do app vão só para o log (Better Stack, já na política como "registros
 * técnicos"), nunca para o banco. Sem login: o erro pode acontecer antes dele.
 */
@ApiTags('client-errors')
@Controller('client-errors')
export class ClientErrorsController {
  private readonly logger = new Logger('ClientError');

  @Public()
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Registra um erro do app no log técnico' })
  @ApiNoContentResponse()
  report(@Body() dto: ReportClientErrorDto): void {
    this.logger.warn({
      clientError: {
        message: scrub(dto.message),
        stack: dto.stack ? scrub(dto.stack) : undefined,
        screen: dto.screen,
        appVersion: dto.appVersion,
        platform: dto.platform,
        fatal: dto.fatal,
      },
    });
  }
}
