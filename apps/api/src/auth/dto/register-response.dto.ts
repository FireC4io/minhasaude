import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../database/entities/user.entity';

export class RegisterResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus' })
  status!: UserStatus;
}
