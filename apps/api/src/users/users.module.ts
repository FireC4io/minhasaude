import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Profile } from '../database/entities/profile.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { AccountDeletionRequest } from '../database/entities/account-deletion-request.entity';
import { Consent } from '../database/entities/consent.entity';
import { ConsentsModule } from '../consents/consents.module';
import { BodyMeasurementsModule } from '../body-measurements/body-measurements.module';
import { GoalsModule } from '../goals/goals.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    // Consent também é registrado aqui (além de em ConsentsModule) porque
    // RequireConsentGuard é usado via @UseGuards() direto no UsersController,
    // e Nest resolve as dependências do guard no contexto do módulo que o usa.
    TypeOrmModule.forFeature([User, Profile, RefreshToken, AccountDeletionRequest, Consent]),
    ConsentsModule,
    BodyMeasurementsModule,
    GoalsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
