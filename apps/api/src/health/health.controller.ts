import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Consulta o Postgres de propósito: um ping periódico (ex.: cron de CI) neste
  // endpoint também evita a pausa do projeto Supabase free tier por inatividade
  // (ver ADR-0007) - um health check que não toca o banco não resolveria isso.
  @Public()
  @Get()
  async check(): Promise<{ status: 'ok'; timestamp: string; database: 'up'; commit: string | null }> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível');
    }
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'up',
      // Commit em execução (o Render define RENDER_GIT_COMMIT). O workflow
      // `deploy-check` compara com o commit enviado para saber se o deploy
      // entrou no ar — 25 deploys falharam em silêncio antes disso existir.
      // O repo é público, então o hash não revela nada.
      commit: process.env.RENDER_GIT_COMMIT ?? null,
    };
  }
}
