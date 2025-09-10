import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { PC5MarketView } from 'src/database/mssql.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as zlib from 'zlib';
import { promisify } from 'util';
import * as path from 'path';

const gzip = promisify(zlib.gzip);
const writeFile = promisify(fs.writeFile);

@Injectable()
export class CronSyncService implements OnModuleInit {
  private readonly logger = new Logger(CronSyncService.name);

  constructor(
    @InjectRepository(PC5MarketView)
    private readonly PC5MarketViewRepo: Repository<PC5MarketView>,
  ) {}

  async syncFunction() {
    const data = await this.PC5MarketViewRepo.find();

    const jsonData = JSON.stringify(data, null, 2);
    const compressedData = await gzip(jsonData);

    const date = new Date();
    const dir = path.join(__dirname, '../../../files/sync', date.toISOString().split('T')[0]);
    const fileName = `${date.toISOString().split('T')[1].replace(/:/g, '-')}.json.gz`;
    const filePath = path.join(dir, fileName);
    await fs.promises.mkdir(dir, { recursive: true });
    await writeFile(filePath, compressedData);

    return {
      message: 'Deep sync completed successfully',
      filePath: filePath,
    };
  }

  async onModuleInit() {
    await this.syncFunction();
  }

  @Cron('5 9 * * *') 
  async handleCron905() {
    await this.syncFunction();
  }

  @Cron('5 11 * * *') 
  async handleCron1105() {
    await this.syncFunction();
  }

  @Cron('5 14 * * *') 
  async handleCron1405() {
    await this.syncFunction();
  }

  @Cron('15 17 * * *') 
  async handleCron1715() {
    await this.syncFunction();
  }
}
