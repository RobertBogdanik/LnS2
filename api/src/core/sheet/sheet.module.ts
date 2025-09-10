import { Module } from '@nestjs/common';
import { SheetService } from './sheet.service';
import { SheetController } from './sheet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Import, ImportPosition, PC5MarketView, Sheet, SheetPosition } from 'src/database/mssql.entity';
import { PdfService } from 'src/modules/pdf/pdf.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sheet, SheetPosition, PC5MarketView, Import, ImportPosition])],
  controllers: [SheetController],
  providers: [SheetService, PdfService],
})
export class SheetModule {}
