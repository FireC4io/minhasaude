import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserStatus } from '../../database/entities/user.entity';

export class RegisterResponseDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  email!: string;

  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus' })
  @Expose()
  status!: UserStatus;
}
