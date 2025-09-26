import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Import, ImportPosition, PC5MarketView, Sheet } from 'src/database/mssql.entity';
import { In, LessThan, Repository } from 'typeorm';
import { WinstonLogger } from '../../config/winston.logger';

@Injectable()
export class CronService {
  constructor(
    @InjectRepository(Import)
    private readonly importRepo: Repository<Import>,

    @InjectRepository(ImportPosition)
    private readonly importPositionRepo: Repository<ImportPosition>,

    @InjectRepository(Sheet)
    private readonly sheetRepo: Repository<Sheet>,

    private readonly logger: WinstonLogger
  ) {
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async deactivateImports() {
    const olderThen = new Date(Date.now() - 15 * 60 * 1000);

    // Deactivate ImportPositions whose Import is disabled and updatedAt is older than 15 minutes
    this.logger.log('Starting deactivation of ImportPositions with disabled Imports...');
    const imports = await this.importPositionRepo.find({
      where: { import: { isDisabled: true } },
      relations: ['import']
    });
    for (const impPos of imports) {
      await this.importPositionRepo.update({ id: impPos.id }, { isDisabled: true });
      this.logger.log(`Deactivated ImportPosition id=${impPos.id} because its Import is disabled.`);
    }

    this.logger.log('Checking for inactive Sheets older than 15 minutes...');
    const inactiveSheets = await this.sheetRepo.find({ where: { active: false, created_at: LessThan(olderThen) } });
    if (inactiveSheets.length > 0) {
      const sheetIds = inactiveSheets.map(sheet => sheet.id);
      this.logger.log(`Found ${sheetIds.length} inactive Sheets: [${sheetIds.join(', ')}]. Deactivating related Imports...`);
      await this.importRepo.update({ sheet: In(sheetIds) }, { isDisabled: true });

      const relatedImports = await this.importRepo.find({ where: { sheet: In(sheetIds) } });
      const importIds = relatedImports.map(imp => imp.id);
      if (importIds.length > 0) {
        this.logger.log(`Deactivating ImportPositions for Imports: [${importIds.join(', ')}]`);
        await this.importPositionRepo.update({ import: In(importIds) }, { isDisabled: true });
      }
    } else {
      this.logger.log('No inactive Sheets found.');
    }

    // Deactivate Import if all its ImportPositions are not active
    this.logger.log('Checking Imports for deactivation if all ImportPositions are disabled...');
    const allImports = await this.importRepo.find({
      where: { isDisabled: false, importedAt: LessThan(olderThen) }
    });
    for (const imp of allImports) {
      const activePositions = await this.importPositionRepo.count({ where: { import: { id: imp.id }, isDisabled: false } });
      if (activePositions === 0 && !imp.isDisabled) {
        await this.importRepo.update({ id: imp.id }, { isDisabled: true });
        this.logger.log(`Deactivated Import id=${imp.id} because all its ImportPositions are disabled.`);
      }
    }

    // If import is empty (no positions) - deactivate it
    this.logger.log('Checking Imports for deactivation if they have no ImportPositions...');
    const importsToCheck = await this.importRepo.find({ where: { isDisabled: false, importedAt: LessThan(olderThen) } });
    for (const imp of importsToCheck) {
      const positionCount = await this.importPositionRepo.count({ where: { import: { id: imp.id } } });
      if (positionCount === 0) {
        await this.importRepo.update({ id: imp.id }, { isDisabled: true });
        this.logger.log(`Deactivated Import id=${imp.id} because it has no ImportPositions.`);
      }
    }

    this.logger.log('Deactivation process completed.');
  }
}
