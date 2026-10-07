import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { foodMicrosPer100g } from '../food-micros';
import { MicrosDto } from './micros.dto';
import { FoodSource } from '../../database/entities/food.entity';

// @Expose() é o que faz o filtro valer em runtime (ver common/serialization/to-dto.ts):
// campos internos da entidade (ownerUserId, externalId, barcode, timestamps) não
// são declarados aqui, então não chegam no cliente.
export class FoodResponseDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  name!: string;

  // `source` NÃO é campo interno: é a procedência do dado nutricional, e o
  // cliente precisa dela pra creditar TACO/Unicamp e Open Food Facts (ODbL),
  // que é obrigatório (ver CLAUDE.md).
  @ApiProperty({ enum: FoodSource, enumName: 'FoodSource' })
  @Expose()
  source!: FoodSource;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  brand!: string | null;

  @ApiProperty()
  @Expose()
  kcalPer100g!: string;

  @ApiProperty()
  @Expose()
  proteinGPer100g!: string;

  @ApiProperty()
  @Expose()
  fatGPer100g!: string;

  @ApiProperty()
  @Expose()
  carbGPer100g!: string;

  // Por 100 g. Montado da entidade (jsonb + coluna antiga de fibra) — o
  // cliente nunca vê o jsonb cru.
  @ApiProperty({ type: MicrosDto })
  @Expose()
  @Transform(({ obj }) => foodMicrosPer100g(obj), { toClassOnly: true })
  @Type(() => MicrosDto)
  micros!: MicrosDto;
}
