import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('search')
  async searchProducts(
    @Query('q') q: string,
    @Query('aso') aso: string,
    @Query('status') status: string,
    @Query('padding') padding: number,
    @Query('limit') limit: number
  ) {
    return this.productsService.searchProducts(q, aso, status, padding, limit);
  }

  @Get('asos')
  async getAllUniqueAsos() {
    return this.productsService.getAllUniqueAsos();
  }

  @Get(":TowID")
  async getProduct(@Param("TowID") TowID: number) {
    return this.productsService.findOne(TowID);
  }

  @Put(":TowID")
  async updateProduct(@Param("TowID") TowID: number, @Body('shelf') shelf: any) {
    return this.productsService.changeDelta(TowID, shelf);
  }
}
