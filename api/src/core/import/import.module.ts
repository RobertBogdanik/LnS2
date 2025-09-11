import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Count, Import, ImportPosition, PC5MarketView, Sheet, SheetPosition, User } from 'src/database/mssql.entity';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Sheet, SheetPosition, PC5MarketView, Import, ImportPosition, User, Count])],
  controllers: [ImportController],
  providers: [ImportService, AuthService, JwtService],
})
export class ImportModule {}
