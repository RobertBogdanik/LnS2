import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';

import * as path from 'path';
import * as fs from 'fs/promises';
import { ConfigService } from '@nestjs/config';
import { WinstonLogger } from 'src/config/winston.logger';

@Injectable()
export class FilesService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: WinstonLogger
  ) {}
  async downloadFile(filePath: string) {
    const basicPath = this.configService.get<string>('BASIC_PATH');
    if (!basicPath)  throw new Error('BASIC_PATH is not defined');

    this.logger.log(`Attempting to download file ${filePath} from ${basicPath}`);
    const fullPath = path.join(basicPath, filePath);
    this.logger.log(`Full file path: ${fullPath}`);

    try {
      const fileBuffer = await fs.readFile(fullPath);
      this.logger.log(`File ${filePath} read successfully, size: ${fileBuffer.length} bytes`);
      return fileBuffer;
    } catch (error) {
      this.logger.error(`Error reading file ${filePath}: ${error.message}`);
      throw new NotFoundException(`File not found or cannot be read: ${error.message}`);
    }
  }

  async getImage(code: string) {
    const imgPath = this.configService.get<string>('IMG_PATH');
    if (!imgPath)  throw new Error('IMG_PATH is not defined');
    const fullPath = path.join(imgPath, `${code}.jpg`);
    this.logger.log(`Attempting to get image ${code} from ${fullPath}`);
    try {
      const fileBuffer = await fs.readFile(fullPath);
      this.logger.log(`Image ${code} read successfully, size: ${fileBuffer.length} bytes`);
      return fileBuffer;
    } catch (error) {
      this.logger.error(`Error reading image ${code}: ${error.message}`);

      const grayBg = Buffer.alloc(800 * 800 * 3, 128);
      return grayBg;
    }
  }
}
