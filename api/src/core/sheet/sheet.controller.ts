import { Body, Controller, Delete, Get, Param, Post, Put, Query, UnauthorizedException } from '@nestjs/common';
import { SheetService } from './sheet.service';
import { UserHeaders } from 'src/decorators/headers.decorator';
import { UserHeadersType } from 'src/middleware/headers.middleware';

@Controller('sheet')
export class SheetController {
  constructor(private readonly sheetService: SheetService) {}

  @Get('')
  async findSheets(
    @Query('padding') padding: number,
    @Query('limit') limit: number,
    @Query('q') q: string,
    @Query('statuses') statuses: string,
    @UserHeaders() headers: UserHeadersType
  ) {
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');
    return this.sheetService.findSheets(padding, limit, q, statuses.split(','), headers.count);
  }

  @Get('dynamicPiku')
  async findDynamicPiku() {
    return await this.sheetService.findDynamicPiku();
  }

  @Get('toSign')
  async findSheetsToSign(@UserHeaders() headers: UserHeadersType) {
    
    if (!headers.decodedJwt?.usid) throw new UnauthorizedException('Brak uprawnień do podpisania arkusza');
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');

    return this.sheetService.findSheetsToSign(headers.decodedJwt.usid, headers.count);
  }

  
  @Get('toSign/:id')
  async findSheetsToSignPos(
    @Param('id') id: number,
    @UserHeaders() headers: UserHeadersType
  ) {
    if (!headers.decodedJwt?.usid) throw new UnauthorizedException('Brak uprawnień do podpisania arkusza');
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');
    
    return this.sheetService.findSheetsToSignPos(id, headers.decodedJwt.usid, headers.count);
  }

  @Get(':id')
  async findSheetById(
    @Param('id') id: number
  ) {
    return this.sheetService.findSheetById(id);
  }

  @Post('')
  async createSheet(
    @Body('origin') originId: number,
    @Body('piku') piku: string,
    @UserHeaders() headers: UserHeadersType
  ) {
    if (!headers.printer) throw new UnauthorizedException('Brak nazwy drukarki');

    return this.sheetService.createSheet(originId, piku, headers.printer);
  }

  @Post('temp')
  async createTempSheet(
    @Body('products') products: any[],
    @UserHeaders() headers: UserHeadersType
  ) {
    if (!headers.decodedJwt?.usid) throw new UnauthorizedException('Brak uprawnień do podpisania arkusza');
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');
    
    return await this.sheetService.createTempSheet(products, headers.count, headers.decodedJwt.usid);
  }

  @Post('dynamic')
  async createDynamicSheet(
    @Body('piku') piku: string,
    @UserHeaders() headers: UserHeadersType
  ) {
    if (!headers.decodedJwt?.usid) throw new UnauthorizedException('Brak uprawnień do podpisania arkusza');
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');
    if (!headers.printer) throw new UnauthorizedException('Brak nazwy drukarki');

    return await this.sheetService.createDynamicSheet(piku, headers.decodedJwt.usid, headers.count, headers.printer);
  }

  @Put(':id/close')
  async closeSheet(
    @Param('id') id: number,
    @UserHeaders() headers: UserHeadersType
  ) {
    if (!headers.decodedJwt?.usid) throw new UnauthorizedException('Brak uprawnień do podpisania arkusza');
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');

    return this.sheetService.closeSheet(id, headers.decodedJwt.usid, headers.count);
  }

  @Put(':id/sign')
  async signSheet(
    @Param('id') id: number,
    @Body('positions') positions: any[],
    @UserHeaders() headers: UserHeadersType
  ) {
    if (!headers.decodedJwt?.usid) throw new UnauthorizedException('Brak uprawnień do podpisania arkusza');
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');

    return this.sheetService.signSheet(id, positions, headers.decodedJwt.usid, headers.count);
  }

  @Delete(':id')
  async deleteSheet(
    @Param('id') id: number,
    @UserHeaders() headers: UserHeadersType
  ) {
    if (!headers.decodedJwt?.usid) throw new UnauthorizedException('Brak uprawnień do usunięcia arkusza');
    return this.sheetService.deleteSheet(id, headers.decodedJwt.usid);
  }
}