import { Module } from '@nestjs/common';
import { RaportsController } from './raports.controller';
import { RaportsService } from './raports.service';

@Module({
  controllers: [RaportsController],
  providers: [RaportsService],
  exports: [RaportsService],
})
export class RaportsModule {}
