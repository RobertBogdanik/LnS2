import { Controller, Get, Param } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('sheet/:id/basic')
  async getSheetPdf(@Param('id') id: number) {
    return this.pdfService.generateBasicSheetPdf(id);
  }

  @Get('sheet/:id/kreski')
  async getKreskiSheetPdf(@Param('id') id: number) {
    return this.pdfService.generateKreskiSheetPdf(id);
  }

  @Get('sheet/:id/dynamic')
  async getDynamicSheetPdf(@Param('id') id: number) {
    return this.pdfService.generateDynamicSheetPdf(id);
  }
}
