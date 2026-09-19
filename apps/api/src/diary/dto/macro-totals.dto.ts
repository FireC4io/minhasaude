import { ApiProperty } from '@nestjs/swagger';

export class MacroTotalsDto {
  @ApiProperty()
  kcal!: number;

  @ApiProperty()
  proteinG!: number;

  @ApiProperty()
  fatG!: number;

  @ApiProperty()
  carbG!: number;
}
