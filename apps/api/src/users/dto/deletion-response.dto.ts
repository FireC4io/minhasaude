import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DeletionResponseDto {
  // `pending_retry`: a conta já está bloqueada, mas o purge falhou no meio e o
  // job diário termina a exclusão.
  @ApiProperty({ enum: ['deleted', 'pending_retry'], enumName: 'DeletionStatus' })
  @Expose()
  status!: 'deleted' | 'pending_retry';
}
