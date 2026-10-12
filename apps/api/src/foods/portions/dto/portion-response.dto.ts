import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { PORTION_KINDS, type PortionKind } from '@minhasaude/shared';

// `userId` não sai: o cliente só precisa saber se a medida é dele (`custom`).
export class PortionResponseDto {
  @ApiProperty()
  @Expose()
  id!: string;

  /** Medida do sistema; o app traduz. null = medida criada pela pessoa. */
  @ApiProperty({ enum: PORTION_KINDS, enumName: 'PortionKind', nullable: true })
  @Expose()
  kind!: PortionKind | null;

  /** Nome dado pela pessoa. null nas medidas do sistema. */
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  label!: string | null;

  @ApiProperty({ example: '25.00' })
  @Expose()
  grams!: string;

  @ApiProperty()
  @Expose()
  @Transform(({ obj }: { obj: { userId?: string | null } }) => obj.userId != null, { toClassOnly: true })
  custom!: boolean;
}
