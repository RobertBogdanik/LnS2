import { Controller, Get } from '@nestjs/common';

@Controller('raports')
export class RaportsController {

    @Get('printers')
    async getPrinters() {
        return [
            "NARZEDZIA-01",
            "NARZEDZIA-02",
            "Farby01"
        ]
    }
}
