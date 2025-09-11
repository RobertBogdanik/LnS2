import { BadRequestException, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { InjectRepository } from '@nestjs/typeorm';
import { Count, Import, ImportPosition, PC5MarketView, Sheet, SheetPosition } from 'src/database/mssql.entity';
import { In, Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';

interface DataIn {
    name: string;
    letter: string;
    origin: string;
    parsed: any[];
    sheets: any[];
}

@Injectable()
export class ImportService {
    constructor(
        @InjectRepository(Sheet) private sheetRepository: Repository<Sheet>,
        @InjectRepository(SheetPosition) private sheetPositionRepository: Repository<SheetPosition>,
        @InjectRepository(PC5MarketView) private pc5MarketViewRepository: Repository<PC5MarketView>,
        @InjectRepository(Import) private importRepository: Repository<Import>,
        @InjectRepository(ImportPosition) private importPositionRepository: Repository<ImportPosition>,
        @InjectRepository(Count) private countRepository: Repository<Count>,
        private configService: ConfigService,
        private authService: AuthService
    ) {}

    async importData(files: DataIn[], UsId: number, count: number) {        
        const userExists = await this.authService.verifyUser(UsId);
        if (!userExists) throw new BadRequestException(['Nie znaleziono użytkownika o podanym ID.']);

        const countRecord = await this.countRepository.findOne({ where: { id: count } });
        if (!countRecord) throw new BadRequestException(['Nie znaleziono liczenia o podanym ID.']);

        const countName = countRecord.name;

        const basicPath = this.configService.get<string>('BASIC_PATH');
        if (!basicPath)  throw new Error('BASIC_PATH is not defined');
        
        // operacje plik po pliku
        for (const file of files) {
            // Zapisanie pliku RAW oraz JSON
            const RAWdirPath = path.join(basicPath, `imports/${countName}/${new Date().toISOString().slice(0, 10)}/RAW`);
            await fs.mkdir(RAWdirPath, { recursive: true });

            let counter = 1;
            let filePath = path.join(RAWdirPath, `${file.name}_${counter}.txt`);

            while (true) {
                try {
                    await fs.access(filePath);
                    counter++;
                    filePath = path.join(RAWdirPath, `${file.name}_${counter}.txt`);
                } catch {
                    break;
                }
            }
            await fs.writeFile(filePath, file.origin);

            const parsedFilePath = path.join(RAWdirPath, `${file.name}_${counter}.json`);
            await fs.writeFile(parsedFilePath, JSON.stringify(file.parsed));

            // Wyodrębnienie unikalnych arkuszy
            const uniqueSheets = Array.from(new Set(file.parsed.map(sheet => sheet.arkusz)));
            const matchingSheets = uniqueSheets
                .map(sheetName => sheetName.trim())
                .filter(sheetName => sheetName.trim().replace(/[^a-zA-Z]/g, '') === file.name[0])

            // pobieranie otwartych arkuszy
            const openSheets = await this.sheetRepository.find({
                where: {
                    name: In(matchingSheets),
                    closed_at: IsNull(),
                },
            });
            
            if (openSheets.length === 0) {
                console.log('Brak otwartych arkuszy do przetworzenia.');
                continue;
            }

            // Filtrowanie pozycji do tych z otwartych arkuszy i z stanem nie 0
            const passedPositions = file.parsed
                .filter(pos => openSheets.some(sheet => sheet.name === pos.arkusz.trim()) && Number(Number(pos.ilosc).toFixed(3)) !== 0)
                .map(pos => ({
                    ...pos,
                    ilosc: Number(Number(pos.ilosc).toFixed(3))
                }));

            // pobieranie wszystkich kodów z produktów
            const allCodes = Array.from(new Set<string>(passedPositions.map(pos => pos.EAN.replace(/\D/g, ''))));

            if (allCodes.length === 0) {
                console.log('Brak kodów do przetworzenia.');
                continue;
            }

            // pobieranie TowID
            const products = await this.pc5MarketViewRepository.createQueryBuilder("pc5market") .where(
                `EXISTS (
                    SELECT 1
                    FROM STRING_SPLIT(REPLACE(PC5Market.ExtraCodes, '?', ''), ';')
                    WHERE value IN (:...allCodes)
                ) OR REPLACE(PC5Market.MainCode, '?', '') IN (:...allCodes)`,
                { allCodes }
            ).getMany();
   
            // dodawanie TowiID
            const passedPositionsWithTowId = passedPositions.map(pos => {
                const cleanEAN = pos.EAN.replace(/\D/g, '');
                const matchedProduct = products.find(product =>
                    product.MainCode.replace(/\?/g, '') === cleanEAN ||
                    (product.ExtraCodes && product.ExtraCodes.replace(/\?/g, '').split(';').includes(cleanEAN))
                );
                return {
                    ...pos,
                    TowId: matchedProduct ? matchedProduct.TowId : null
                };
            });

            const paperBasedSheets = openSheets.filter(sheet => sheet.name.startsWith(file.letter));
            const dynamicBasedSheets = openSheets.filter(sheet => sheet.name.endsWith(file.letter));

            // iteracja po arkuszach papierowych
            for (const sheet of paperBasedSheets) {
                const sheetDirPath = path.join(basicPath, `imports/${countName}/process/${new Date().toISOString().slice(0, 10)}/${sheet.name}`);

                // wybranie pozycji z arkusza
                const positionsForSheet = passedPositionsWithTowId.filter(pos => pos.arkusz.trim() === sheet.name);

                // łączenie tych samych towID
                const towIdMap: Record<string, { TowId: string | null, ilosc: number }> = {};
                for (const pos of positionsForSheet) {
                    if (!pos.TowId) continue;
                    if (!towIdMap[pos.TowId]) {
                        towIdMap[pos.TowId] = { TowId: pos.TowId, ilosc: 0 };
                    }
                    towIdMap[pos.TowId].ilosc += parseFloat(pos.ilosc);
                }
                const groupedPositions = Object.values(towIdMap);

                const outputFilePath = path.join(sheetDirPath, `${file.name}_${counter}_zgrupowane.json`);
                await fs.writeFile(outputFilePath, JSON.stringify(groupedPositions));

                // pobieranie pozycji z arkusza
                const sheetPositions = await this.sheetPositionRepository.find({
                    where: {
                        sheet: {id: sheet.id},
                        productId: In(groupedPositions.map(pos => String(pos.TowId))),
                    },
                });

                // łączenie pozycji
                const positionToImport = sheetPositions
                    .filter(sp => groupedPositions.some(pos => String(pos.TowId) === String(sp.productId)))
                    .map(sp => {
                        const pos = groupedPositions.find(pos => String(pos.TowId) === String(sp.productId));

                        if (!pos) return null;

                        return {
                            counted: pos.ilosc,
                            sheetPos: sp
                        };
                    }).filter((item): item is NonNullable<typeof item> => item !== null);

                const outputFileToImportPath = path.join(sheetDirPath, `${file.name}_${counter}_doimportu.json`);
                await fs.writeFile(outputFileToImportPath, JSON.stringify(positionToImport));

                await this.importRepository.manager.transaction(async transactionalEntityManager => {
                    const newImport = await transactionalEntityManager.save(this.importRepository.create({
                        sheet: sheet, 
                        author: { id: UsId }, 
                        deviceName: file.name[0],
                        isDisabled: false,
                        importedAt: new Date()
                    }));

                    for (const postToIn of positionToImport){
                        const newImportPos = this.importPositionRepository.create({
                            import: newImport,
                            sheetPosition: postToIn.sheetPos,
                            expectedQuantity: postToIn.sheetPos.expectedQuantity,
                            quantity: postToIn.counted,
                            isDisabled: false,
                            lastChange: new Date()
                        });
                        await transactionalEntityManager.save(newImportPos);
                    }

                    await transactionalEntityManager.update(
                        Sheet,
                        { id: sheet.id },
                        { closed_at: new Date(), closed_by: {id:7} }
                    );
                });
            }

            for (const sheet of dynamicBasedSheets) {
                const sheetDirPath = path.join(basicPath, `imports/${countName}/process/${new Date().toISOString().slice(0, 10)}/${sheet.name}`);

                const positionsForSheet = passedPositionsWithTowId.filter(pos => pos.arkusz.trim() === sheet.name);

                const towIdMap: Record<string, { TowId: string | null, ilosc: number }> = {};
                for (const pos of positionsForSheet) {
                    if (!pos.TowId) continue;
                    if (!towIdMap[pos.TowId]) {
                        towIdMap[pos.TowId] = { TowId: pos.TowId, ilosc: 0 };
                    }
                    towIdMap[pos.TowId].ilosc += parseFloat(pos.ilosc);
                }
                const groupedPositions = Object.values(towIdMap);

                const expectedForProducts = await this.pc5MarketViewRepository.find({
                    where: {
                        TowId: In(groupedPositions.map(pos => Number(pos.TowId)))
                    }
                })

                await this.importRepository.manager.transaction(async transactionalEntityManager => {
                    const createdPositions: any[] = [];

                    for (const product of groupedPositions) {
                        const expectedQuantity = expectedForProducts.find(p => p.TowId === Number(product.TowId))?.StockQty;

                        if (!expectedQuantity) continue;

                        const sheetPosition = await transactionalEntityManager.save(this.sheetPositionRepository.create({
                            sheet: sheet,
                            productId: Number(product.TowId),
                            expectedQuantity: expectedQuantity,
                            comment: '',
                            isDisabled: false
                        }));

                        createdPositions.push(sheetPosition);
                    }

                    const newImport = await transactionalEntityManager.save(this.importRepository.create({
                        sheet: sheet, 
                        author: { id: UsId }, 
                        deviceName: file.name[0],
                        isDisabled: false,
                        importedAt: new Date()
                    }));

                    for (const postToIn of groupedPositions){
                        const sheetPosition = createdPositions.find(pos => pos.productId === Number(postToIn.TowId));
                        if (!sheetPosition) continue;

                        const newImportPos = this.importPositionRepository.create({
                            import: newImport,
                            sheetPosition: sheetPosition,
                            expectedQuantity: expectedForProducts.find(p => p.TowId === Number(postToIn.TowId))?.StockQty,
                            quantity: postToIn.ilosc,
                            isDisabled: false,
                            lastChange: new Date()
                        });
                        await transactionalEntityManager.save(newImportPos);
                    }

                    await transactionalEntityManager.update(
                        Sheet,
                        { id: sheet.id },
                        { closed_at: new Date(), closed_by: {id:7} }
                    );
                });
            }
        }

        return {
            success: true,
            message: `Import completed for ${files.length} file(s)`,
        }
    }
}
