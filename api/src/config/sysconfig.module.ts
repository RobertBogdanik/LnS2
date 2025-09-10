import { Module } from '@nestjs/common';
import { CronModule } from './corn/cron.module';

// Import other modules from subdirectories

@Module({
    imports: [
        CronModule
    ],
})
export class SysConfigModule {}