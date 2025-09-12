import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Count, CountProductStatusView, Import, ImportPosition, PC5MarketView, Sheet, SheetPosition, User } from 'src/database/mssql.entity';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { WinstonLogger } from 'src/config/winston.logger';

@Module({
  imports: [TypeOrmModule.forFeature([PC5MarketView, SheetPosition, Sheet, ImportPosition, Import, CountProductStatusView, User, Count])],
  controllers: [ProductsController],
  providers: [ProductsService, AuthService, JwtService, WinstonLogger],
})
export class ProductsModule {}
