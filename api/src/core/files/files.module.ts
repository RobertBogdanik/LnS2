import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { WinstonLogger } from 'src/config/winston.logger';

@Module({
  controllers: [FilesController],
  providers: [FilesService, WinstonLogger],
})
export class FilesModule {}
