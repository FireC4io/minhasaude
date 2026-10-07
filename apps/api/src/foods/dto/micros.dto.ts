import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// Espelha `Micros` do shared. null = a fonte não mediu (nunca zero inventado).
// Declarado campo a campo para o Swagger/orval gerarem tipos de verdade.
export class MicrosDto {
  @ApiProperty({ type: Number, nullable: true }) @Expose() fiberG!: number | null;
  @ApiProperty({ type: Number, nullable: true }) @Expose() sodiumMg!: number | null;
  @ApiProperty({ type: Number, nullable: true }) @Expose() potassiumMg!: number | null;
  @ApiProperty({ type: Number, nullable: true }) @Expose() calciumMg!: number | null;
  @ApiProperty({ type: Number, nullable: true }) @Expose() ironMg!: number | null;
  @ApiProperty({ type: Number, nullable: true }) @Expose() magnesiumMg!: number | null;
  @ApiProperty({ type: Number, nullable: true }) @Expose() zincMg!: number | null;
  @ApiProperty({ type: Number, nullable: true }) @Expose() vitaminCMg!: number | null;
  @ApiProperty({ type: Number, nullable: true }) @Expose() vitaminARaeMcg!: number | null;
}

export class MicroTotalDto {
  @ApiProperty() @Expose() amount!: number;
  /** Quantos itens do dia tinham esse nutriente medido. */
  @ApiProperty() @Expose() itemsWithData!: number;
  @ApiProperty() @Expose() items!: number;
}

export class MicroTotalsDto {
  @ApiProperty({ type: MicroTotalDto }) @Expose() @Type(() => MicroTotalDto) fiberG!: MicroTotalDto;
  @ApiProperty({ type: MicroTotalDto }) @Expose() @Type(() => MicroTotalDto) sodiumMg!: MicroTotalDto;
  @ApiProperty({ type: MicroTotalDto }) @Expose() @Type(() => MicroTotalDto) potassiumMg!: MicroTotalDto;
  @ApiProperty({ type: MicroTotalDto }) @Expose() @Type(() => MicroTotalDto) calciumMg!: MicroTotalDto;
  @ApiProperty({ type: MicroTotalDto }) @Expose() @Type(() => MicroTotalDto) ironMg!: MicroTotalDto;
  @ApiProperty({ type: MicroTotalDto }) @Expose() @Type(() => MicroTotalDto) magnesiumMg!: MicroTotalDto;
  @ApiProperty({ type: MicroTotalDto }) @Expose() @Type(() => MicroTotalDto) zincMg!: MicroTotalDto;
  @ApiProperty({ type: MicroTotalDto }) @Expose() @Type(() => MicroTotalDto) vitaminCMg!: MicroTotalDto;
  @ApiProperty({ type: MicroTotalDto }) @Expose() @Type(() => MicroTotalDto) vitaminARaeMcg!: MicroTotalDto;
}
