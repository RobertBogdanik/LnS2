import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PC5MarketView, Sheet, SheetPosition } from 'src/database/mssql.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sheet, SheetPosition, PC5MarketView]),
  ],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
