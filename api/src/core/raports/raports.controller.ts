import { Controller, Get, Query } from '@nestjs/common';
import { RaportsService } from './raports.service';

@Controller('raports')
export class RaportsController {
    constructor(
        private readonly raportsService: RaportsService,
    ) {}

    @Get('printers')
    async getPrinters() {
        return await this.raportsService.getPrinters();
    }

    @Get('print')
    async print(
        @Query('printer') printer: string,
        @Query('pathToPdf') pathToPdf: string,
    ) {
        return await this.raportsService.print(printer, pathToPdf);
    }
}
