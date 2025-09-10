import { Controller, Get, Post, Body, Patch, Param, Delete, Query, StreamableFile, Res } from '@nestjs/common';
import { Response } from 'express';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';

import * as path from 'path';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('download')
  async downloadFile(@Query('path') filePath: string, @Res() res: Response) {
    const fileBuffer = await this.filesService.downloadFile(filePath);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
      'Content-Length': fileBuffer.length,
    });
    res.send(fileBuffer);
  }
}
