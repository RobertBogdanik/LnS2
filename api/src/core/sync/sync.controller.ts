import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('deep')
  async deepSync() {
    return await this.syncService.deepSync();
  }

  @Get('by-timestamp')
  async syncByTimestamp(
    @Query('lastSyncs') lastSyncs: Date
  ) {
    console.log("Syncing by timestamp with lastSyncs:", lastSyncs);
    if (!lastSyncs || isNaN(new Date(lastSyncs).getTime())) {
      throw new BadRequestException(['Niepoprawny format daty ostatniej synchronizacji.']);
    }
    return await this.syncService.syncByTimestamp(lastSyncs);
  }
  @Get('count/by-timestamp')
  async syncCountByTimestamp(
    @Query('lastSyncs') lastSyncs: Date,
    @Query('countId') countId: number
  ) {
    console.log("Syncing count by timestamp with lastSyncs:", lastSyncs);
    if (!lastSyncs || isNaN(new Date(lastSyncs).getTime())) {
      throw new BadRequestException(['Niepoprawny format daty ostatniej synchronizacji.']);
    }
    return await this.syncService.syncCountByTimestamp(lastSyncs, countId);
  }
}
