import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountProductStatusView, PC5MarketView } from 'src/database/mssql.entity';
import { CronModule } from 'src/config/corn/cron.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PC5MarketView, CountProductStatusView]),
    CronModule
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
