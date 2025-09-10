import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountProductStatusView, Import, ImportPosition, PC5MarketView, Sheet, SheetPosition } from 'src/database/mssql.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PC5MarketView, SheetPosition, Sheet, ImportPosition, Import, CountProductStatusView])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
