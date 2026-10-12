import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { PORTION_LIMITS } from '@minhasaude/shared';

// Medida criada pela pessoa ("minha caneca = 180 g"). O nome volta na
// exportação LGPD: sem < e >, como o nome de alimento.
export class CreatePortionDto {
  @ApiProperty({ example: 'Minha caneca', maxLength: PORTION_LIMITS.labelMax })
  @IsString()
  @MaxLength(PORTION_LIMITS.labelMax)
  @Matches(/^[^<>]*\S[^<>]*$/, { message: 'nome obrigatório, sem < ou >' })
  label!: string;

  @ApiProperty({ example: 180, minimum: PORTION_LIMITS.gramsMin, maximum: PORTION_LIMITS.gramsMax })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PORTION_LIMITS.gramsMin)
  @Max(PORTION_LIMITS.gramsMax)
  grams!: number;
}
