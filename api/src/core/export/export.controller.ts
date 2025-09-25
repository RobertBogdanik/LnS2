import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { ExportService } from './export.service';
import { UserHeaders } from 'src/decorators/headers.decorator';
import { UserHeadersType } from 'src/middleware/headers.middleware';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  async exportAll(@UserHeaders() headers: UserHeadersType) {
    if (!headers.count) throw new UnauthorizedException('Brak liczenia');
    
    return this.exportService.getExports(headers.count);
  }

  @Get('exportPart')
  async exportPart(@UserHeaders() headers: UserHeadersType) {
    if (!headers.decodedJwt?.usid) throw new UnauthorizedException('Brak uprawnień do podpisania arkusza');
    if (!headers.count) throw new UnauthorizedException('Brak liczenia');
      
    return this.exportService.exportPart(headers.decodedJwt.usid, headers.count);
  }
}
