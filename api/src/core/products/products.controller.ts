import { Body, Controller, Get, Param, Put, Query, UnauthorizedException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { UserHeadersType } from 'src/middleware/headers.middleware';
import { UserHeaders } from 'src/decorators/headers.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('search')
  async searchProducts(
    @Query('q') q: string,
    @Query('aso') aso: string,
    @Query('status') status: string,
    @Query('padding') padding: number,
    @Query('limit') limit: number,
    @UserHeaders() headers: UserHeadersType
  ) {
    console.log(headers);
    if (!headers.decodedJwt?.usid) throw new UnauthorizedException('Brak uprawnień do podpisania arkusza');
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');

    return this.productsService.searchProducts(q, aso, status, headers.decodedJwt.usid, headers.count, padding, limit);
  }

  @Get("stats")
  async getProductStats(@UserHeaders() headers: UserHeadersType) {
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');

    return this.productsService.getStats(headers.count);
  }
  
  @Get('asos')
  async getAllUniqueAsos() {
    return this.productsService.getAllUniqueAsos();
  }

  @Get(":TowID")
  async getProduct(@Param("TowID") TowID: number, @UserHeaders() headers: UserHeadersType) {
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');

    return this.productsService.findOne(TowID, headers.count);
  }

  @Put(":TowID")
  async updateProduct(@Param("TowID") TowID: number, @Body('shelf') shelf: any, @UserHeaders() headers: UserHeadersType) {
    if (!headers.decodedJwt?.usid) throw new UnauthorizedException('Brak uprawnień do podpisania arkusza');
    if (!headers.count) throw new UnauthorizedException('Brak liczeania');
        
    return this.productsService.changeDelta(TowID, shelf, headers.decodedJwt.usid, headers.count);
  }
}