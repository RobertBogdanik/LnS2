import { Module } from '@nestjs/common';
import { RaportsController } from './raports.controller';
import { RaportsService } from './raports.service';
import { WinstonLogger } from 'src/config/winston.logger';

@Module({
  controllers: [RaportsController],
  providers: [RaportsService, WinstonLogger],
  exports: [RaportsService],
})
export class RaportsModule {}
