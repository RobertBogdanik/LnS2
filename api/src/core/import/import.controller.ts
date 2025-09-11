import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ImportService } from './import.service';
import { UserHeaders } from 'src/decorators/headers.decorator';
import { UserHeadersType } from 'src/middleware/headers.middleware';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post()
  async importData(@Body() files: any[], @UserHeaders() headers: UserHeadersType) {

    if (!headers.decodedJwt?.usid) throw new UnauthorizedException('Brak uprawnień do podpisania arkusza');
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');

    return this.importService.importData(files, headers.decodedJwt.usid, headers.count);
  }
}
