import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Import, ImportPosition, PC5MarketView, Sheet, SheetPosition } from 'src/database/mssql.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sheet, SheetPosition, PC5MarketView, ImportPosition, Import]),
  ],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
