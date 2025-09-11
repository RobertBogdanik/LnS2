import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
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
    @Query('statuses') statuses: string
  ) {
    return this.sheetService.findSheets(padding, limit, q, statuses.split(','));
  }

  @Get('dynamicPiku')
  async findDynamicPiku() {
    return await this.sheetService.findDynamicPiku();
  }

  @Get('toSign')
  async findSheetsToSign() {
    return this.sheetService.findSheetsToSign();
  }

  
  @Get('toSign/:id')
  async findSheetsToSignPos(@Param('id') id: number) {
    return this.sheetService.findSheetsToSignPos(id);
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
    return this.sheetService.createSheet(originId, piku, headers);
  }

  @Post('temp')
  async createTempSheet(
    @Body('products') products: any[]
  ) {
    // TODO: make dynamic
    return await this.sheetService.createTempSheet(products, 3, 7);
  }

  @Post('dynamic')
  async createDynamicSheet(
    @Body('piku') piku: string
  ) {
    return await this.sheetService.createDynamicSheet(piku);
  }

  @Put(':id/close')
  async closeSheet(
    @Param('id') id: number
  ) {
    return this.sheetService.closeSheet(id);
  }

  @Put(':id/sign')
  async signSheet(
    @Param('id') id: number,
    @Body('positions') positions: any[]
  ) {
    return this.sheetService.signSheet(id, positions);
  }

  @Put(':id/product')
  async updateProduct() {
    // return this.sheetService.updateProduct();
  }

  @Put(':id/open')
  async openSheet() {
    // return this.sheetService.openSheet();
  }

  @Delete(':id')
  async deleteSheet(
    @Param('id') id: number
  ) {
    return this.sheetService.deleteSheet(id);
  }

  @Delete(':id/product')
  async deleteProduct() {
    // return this.sheetService.deleteProduct();
  }
}