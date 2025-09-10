import { Injectable } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';

import * as path from 'path';
import * as fs from 'fs/promises';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesService {
  constructor(
    private readonly configService: ConfigService
  ) {}
  async downloadFile(filePath: string) {
    const basicPath = this.configService.get<string>('BASIC_PATH');
    if (!basicPath)  throw new Error('BASIC_PATH is not defined');

    console.log(`Attempting to download file from: ${basicPath}`);
    console.log(`Full file path: ${filePath}`);
    const fullPath = path.join(basicPath, filePath);
    
    try {
      const fileBuffer = await fs.readFile(fullPath);
      return fileBuffer;
    } catch (error) {
      throw new Error(`File not found or cannot be read: ${error.message}`);
    }
  }
}
