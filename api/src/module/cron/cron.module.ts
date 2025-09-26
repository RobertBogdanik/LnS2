import { Module } from '@nestjs/common';
import { CronService } from '../../module/cron/cron.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Import, ImportPosition, Sheet } from 'src/database/mssql.entity';
import { WinstonLogger } from 'src/config/winston.logger';

@Module({
    imports: [
        TypeOrmModule.forFeature([Import, ImportPosition, Sheet]),
    ],
    providers: [CronService, WinstonLogger],
    exports: [CronService],
})
export class CronModule {}