import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { CountProductStatusView, PC5MarketView } from 'src/database/mssql.entity';
import { CronSyncService } from 'src/config/corn/sync.cron.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

    constructor(
        @InjectRepository(PC5MarketView)
        private readonly pc5MarketViewRepo: Repository<PC5MarketView>,

        @InjectRepository(CountProductStatusView)
        private readonly countProductStatusViewRepo: Repository<CountProductStatusView>,

        private readonly deepSyncFunction: CronSyncService,
    ) {}

    async deepSync() {
        return await this.deepSyncFunction.syncFunction();
    }

    async syncByTimestamp(lastSyncs: any) {
        const parsedLastSyncs = new Date(lastSyncs);
        console.log("Parsed last syncs date:", parsedLastSyncs);
        const pc5MarketViews = await this.pc5MarketViewRepo.find({ 
            where: {
                Zmiana: MoreThan(parsedLastSyncs),
            },
         });
         
        this.logger.log(`Found PC5MarketViews: ${pc5MarketViews.length}`);
        const lastZmiana = pc5MarketViews.reduce((latest, curr) => {
        const currDate = new Date(curr.Zmiana);
        return currDate > latest ? currDate : latest;
        }, new Date(0));

        this.logger.log(`Last Zmiana date: ${lastZmiana.toISOString()}`);

        return {
            pc5MarketViews: pc5MarketViews,
            lastZmiana: lastZmiana.toISOString(),
        };
    }

    async syncCountByTimestamp(lastSyncs: any, countId: any) {
        console.log("Syncing count by timestamp with lastSyncs:", lastSyncs, "and countId:", countId);
        if (!lastSyncs || isNaN(new Date(lastSyncs).getTime())) {
            throw new BadRequestException(['Niepoprawny format daty ostatniej synchronizacji.']);
        }

        const countProductStatusViews = await this.countProductStatusViewRepo.find({
            where: {
                LastChange: MoreThan(new Date(lastSyncs)),
                CountID: countId,
            },
        });

        const lastSync = countProductStatusViews.reduce((latest, curr) => {
            const currDate = new Date(curr.LastChange);
            return currDate > latest ? currDate : latest;
        }, new Date(0));

        return {
            lastSyncs: lastSync,
            updates: countProductStatusViews,
        };
    }
}
