import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Count, Import, ImportPosition, PC5MarketView, Sheet, SheetPosition } from 'src/database/mssql.entity';
import { In, IsNull, Not, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { WinstonLogger } from 'src/config/winston.logger';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ExportService {
    constructor(
        @InjectRepository(PC5MarketView) private readonly pc5MarketViewRepository: Repository<PC5MarketView>,
        @InjectRepository(Count) private readonly countRepository: Repository<Count>,
        @InjectRepository(Sheet) private readonly sheetRepository: Repository<Sheet>,
        @InjectRepository(SheetPosition) private readonly sheetPositionRepository: Repository<SheetPosition>,
        @InjectRepository(Import) private readonly importRepository: Repository<Import>,
        @InjectRepository(ImportPosition) private readonly importPositionRepository: Repository<ImportPosition>,

        private readonly configService: ConfigService,
        
        private readonly logger: WinstonLogger,
        private readonly authService: AuthService,
    ) {}

    async getExports(countId: number) {
        const count = await this.countRepository.findOne({
            where: {
                id: countId
                
            }
        });
        if (!count) {
            this.logger.warn(`Count with ID ${countId} not found during getExports.`);
            throw new BadRequestException(['Brak aktywnego liczenia']);
        }

        const basicPath = this.configService.get<string>('BASIC_PATH');
        if (!basicPath) throw new Error('BASIC_PATH is not defined');
        const exportsFolder = path.join(basicPath, `exports/${count}/`);
        if (!fs.existsSync(exportsFolder)) {
            fs.mkdirSync(exportsFolder, { recursive: true });
        }
        const files = fs.readdirSync(exportsFolder);
        return {
            positions: files,
            basicPath: `exports/${count}/`
        };
    }

    async exportPart(UsId: number, countId: number) {
        const userExists = await this.authService.verifyUser(UsId);
        if (!userExists) {
            this.logger.warn(`User with ID ${UsId} not found during delta change.`);
            throw new BadRequestException(['Nie znaleziono użytkownika o podanym ID.']);
        }

        const count = await this.countRepository.findOne({
            where: {
                id: countId
            }
        });
        if (!count) {
            this.logger.warn(`Count with ID ${countId} not found during getExports.`);
            throw new BadRequestException(['Brak aktywnego liczenia']);
        }

        this.logger.log('Starting exportPart process');

        // Znajdź wszystkie aktywne pozycje arkuszy z niepodpisanymi arkuszami
        const activeSheetPositions = await this.sheetPositionRepository.find({
            where: {
                isDisabled: false,
                sheet: {
                    active: true,
                    signing_at: Not(IsNull()),
                    signing_by: Not(IsNull()),
                }
            },
            relations: ['sheet']
        });

        // Pobierz wszystkie importy powiązane z tymi pozycjami arkuszy
        const importPositions = await this.importPositionRepository.find({
            where: {
                sheetPosition: {
                    id: In(activeSheetPositions.map(pos => pos.id))
                },
                import: {
                    isDisabled: false
                },
                isDisabled: false
            },
            relations: ['sheetPosition', 'import']
        });

        const grouped: Array<{ counted: number, expected: number, posId: number }> = [];

        importPositions.forEach(ip => {
            const group = grouped.find(g => g.posId === ip.sheetPosition.id);
            if (group) {
                const index = grouped.indexOf(group);
                grouped[index] = {
                    posId: ip.sheetPosition.id,
                    counted: group.counted + (ip.quantity ?? 0),
                    expected: group.expected + (ip.expectedQuantity ?? 0)
                };
            } else {
                grouped.push({
                    posId: ip.sheetPosition.id,
                    counted: ip.quantity ?? 0,
                    expected: ip.expectedQuantity ?? 0
                });
            }
        });

        this.logger.log(`Grouped ${grouped.length} import positions`);

        activeSheetPositions.forEach(pos => {
            if (!grouped.some(g => g.posId === pos.id)) {
                grouped.push({
                    posId: pos.id,
                    counted: 0,
                    expected: pos.expectedQuantity ?? 0
                });
            }
        });

        this.logger.log(`After adding missing grouped ${grouped.length}`);

        const filtered = grouped.filter(g => g.counted !== g.expected);

        this.logger.log(`Filtered to ${filtered.length} positions with discrepancies`);

        const filteredWithTowID = filtered.map(g => {
            const pos = activeSheetPositions.find(p => p.id === g.posId);
            return {
                ...g,
                towID: pos ? pos.productId : null,
                sheet: pos ? pos.sheet.id : null
            };
        });

        this.logger.log(`Mapped to include TowID, total ${filteredWithTowID.length}`);

        const finalFiltered = filteredWithTowID.filter(g => g.towID !== null);

        this.logger.log(`Final filtered to ${finalFiltered.length} positions with valid TowID`);

        const products = await this.pc5MarketViewRepository.find({
            where: {
                TowId: In(finalFiltered.map(f => f.towID!))
            }
        });

        this.logger.log(`Fetched ${products.length} products from PC5MarketView`);

        const matchedProducts = finalFiltered.map(item => {
            const product = products.find(p => p.TowId === item.towID);
            return { ...item, MainCode: product ? product.MainCode : null };
        });

        this.logger.log(`Matched products, total ${matchedProducts.length}`);

        const finalProducts = matchedProducts.filter(p => p.MainCode !== null);
        this.logger.log(`Final products to export: ${finalProducts.length}`);

        const csvRows = [
            ['MainCode', 'Counted'],
            ...finalProducts.map(p => [p.MainCode, p.counted])
        ];

        const csvContent = csvRows.map(row => row.join(';')).join('\n');
        this.logger.log('CSV content generated');

        const date = new Date();
        await this.importRepository.manager.transaction(async transactionalEntityManager => {
            const uniqueSheets = Array.from(new Set(finalProducts.map(p => p.sheet)));
            this.logger.log(`Processing imports for ${uniqueSheets.length} unique sheets`);

            for (const product of finalProducts) {
                if (!product.posId) continue;

                this.logger.log(`Processing imports for product ${product.towID}, position ${product.posId}`);

                const posImports = await transactionalEntityManager.find(ImportPosition, {
                    where: {
                        sheetPosition: { id: product.posId },
                        isDisabled: false
                    },
                    relations: ['sheetPosition']
                });

                this.logger.log(`Found ${posImports.length} existing import positions for product ${product.towID}, disabling them`);

                for (const posImport of posImports) {
                    posImport.isDisabled = true;
                    posImport.lastChange = new Date();
                    await transactionalEntityManager.save(posImport);
                }
                this.logger.log(`Disabled existing import positions for product ${product.towID}`);
            }

            for (const sheetId of uniqueSheets) {
                if (!sheetId) continue;

                const sheetNeImport = this.importRepository.create({
                    sheet: { id: sheetId }, 
                    author: { id: UsId },
                    deviceName: `EXPORT`,
                    isDisabled: false,
                    importedAt: new Date(),
                    type: 5,
                });
                await transactionalEntityManager.save(sheetNeImport);
                this.logger.log(`Created new import for sheet ${sheetId} with id ${sheetNeImport.id}`);

                const sheetProducts = finalProducts.filter(p => p.sheet === sheetId);
                this.logger.log(`Sheet ${sheetId} has ${sheetProducts.length} products to process`);

                for (const product of sheetProducts) {
                    const importPos = this.importPositionRepository.create({
                        sheetPosition: { id: product.posId },
                        import: sheetNeImport,
                        quantity: product.counted,
                        expectedQuantity: product.counted,
                        isDisabled: false,
                        lastChange: new Date(),
                    });
                    await transactionalEntityManager.save(importPos);
                    this.logger.log(`Created import position for product ${product.MainCode} with id ${importPos.id}`);
                }
            }
        });
         
        const basicPath = this.configService.get<string>('BASIC_PATH');
        if (!basicPath)  throw new Error('BASIC_PATH is not defined');
        const fullPath = path.join(basicPath,  `exports/${count}/`);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }

        const fileName = `export_${date.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')}.csv`;
        const filePath = path.join(fullPath, fileName);
        this.logger.log(`Writing CSV file to ${filePath}`);

        fs.writeFileSync(filePath, csvContent, 'utf8');

        return fileName;
    }
}
