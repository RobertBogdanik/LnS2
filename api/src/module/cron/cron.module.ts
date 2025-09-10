import { Module } from '@nestjs/common';
import { SheetTsService } from './sheet.ts/sheet.ts.service';

@Module({
  providers: [SheetTsService]
})
export class CronModule {}
