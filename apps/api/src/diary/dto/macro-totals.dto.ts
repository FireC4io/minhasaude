import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MacroTotalsDto {
  @ApiProperty()
  @Expose()
  kcal!: number;

  @ApiProperty()
  @Expose()
  proteinG!: number;

  @ApiProperty()
  @Expose()
  fatG!: number;

  @ApiProperty()
  @Expose()
  carbG!: number;
}
