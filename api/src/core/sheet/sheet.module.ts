import { Module } from '@nestjs/common';
import { SheetService } from './sheet.service';
import { SheetController } from './sheet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Count, Import, ImportPosition, PC5MarketView, Sheet, SheetPosition, User } from 'src/database/mssql.entity';
import { PdfService } from 'src/modules/pdf/pdf.service';
import { RaportsService } from '../raports/raports.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Sheet, SheetPosition, PC5MarketView, Import, ImportPosition, User, Count])],
  controllers: [SheetController],
  providers: [SheetService, PdfService, RaportsService, AuthService, JwtService],
})
export class SheetModule {}
