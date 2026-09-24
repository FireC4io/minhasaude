import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserStatus } from '../../database/entities/user.entity';
import { ActivityLevel, Goal, Sex } from '../../database/entities/profile.entity';

export class AccountResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  email!: string;

  @ApiProperty({ type: Date, nullable: true })
  @Expose()
  emailVerifiedAt!: Date | null;

  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus' })
  @Expose()
  status!: UserStatus;

  // `passwordHash` existe na entidade e NÃO é declarado aqui de propósito:
  // com o filtro do toDto, esquecer de removê-lo à mão deixa de ser possível.
}

export class ProfileResponseDto {
  @ApiProperty({ type: String, nullable: true, example: '1995-04-10' })
  @Expose()
  birthDate!: string | null;

  @ApiProperty({ enum: Sex, enumName: 'Sex', nullable: true })
  @Expose()
  sex!: Sex | null;

  @ApiProperty({ type: String, nullable: true, example: '178.0' })
  @Expose()
  heightCm!: string | null;

  @ApiProperty({ enum: ActivityLevel, enumName: 'ActivityLevel', nullable: true })
  @Expose()
  activityLevel!: ActivityLevel | null;

  @ApiProperty({ enum: Goal, enumName: 'Goal', nullable: true })
  @Expose()
  goal!: Goal | null;

  @ApiProperty({ type: Date, nullable: true })
  @Expose()
  goalUpdatedAt!: Date | null;
}

export class MeResponseDto {
  @ApiProperty({ type: AccountResponseDto })
  @Expose()
  @Type(() => AccountResponseDto)
  user!: AccountResponseDto;

  @ApiPropertyOptional({ type: ProfileResponseDto, nullable: true })
  @Expose()
  @Type(() => ProfileResponseDto)
  profile!: ProfileResponseDto | null;
}
