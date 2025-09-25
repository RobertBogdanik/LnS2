import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Count, Import, ImportPosition, PC5MarketView, Sheet, SheetPosition, User } from 'src/database/mssql.entity';
import { WinstonLogger } from 'src/config/winston.logger';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([PC5MarketView, Count, Sheet, SheetPosition, Import, ImportPosition, User]),
  ],
  controllers: [ExportController],
  providers: [ExportService, WinstonLogger, AuthService, JwtService],
})
export class ExportModule {}
