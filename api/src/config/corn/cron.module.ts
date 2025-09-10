import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronSyncService } from './sync.cron.service';
import { PC5MarketView } from 'src/database/mssql.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ScheduleModule.forRoot(),
      TypeOrmModule.forFeature([PC5MarketView])
    ],
  providers: [CronSyncService],
    exports: [CronSyncService], 
})
export class CronModule {}
