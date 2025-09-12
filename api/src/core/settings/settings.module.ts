import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Count, User } from 'src/database/mssql.entity';
import { WinstonLogger } from 'src/config/winston.logger';

@Module({
  imports: [TypeOrmModule.forFeature([User, Count])],
  controllers: [SettingsController],
  providers: [SettingsService, WinstonLogger],
})
export class SettingsModule {}
