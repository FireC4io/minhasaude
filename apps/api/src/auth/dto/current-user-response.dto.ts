import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/** Quem é a pessoa do token (`GET /v1/auth/me`), sem os horários do JWT. */
export class CurrentUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  sub!: string;

  @ApiProperty()
  @Expose()
  email!: string;
}
