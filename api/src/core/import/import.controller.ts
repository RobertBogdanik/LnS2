import { Body, Controller, Post } from '@nestjs/common';
import { ImportService } from './import.service';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post()
  async importData(@Body() files: any[]) {
    return this.importService.importData(files);
  }
}
