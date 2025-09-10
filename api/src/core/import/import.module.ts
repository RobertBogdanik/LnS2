import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Import, ImportPosition, PC5MarketView, Sheet, SheetPosition } from 'src/database/mssql.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sheet, SheetPosition, PC5MarketView, Import, ImportPosition])],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
