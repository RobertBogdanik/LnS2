import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Import, ImportPosition, PC5MarketView, Sheet, SheetPosition } from 'src/database/mssql.entity';
import { PdfService } from 'src/modules/pdf/pdf.service';
import { In, IsNull, Like, Not, Raw, Repository } from 'typeorm';

@Injectable()
export class SheetService {

    constructor(
        @InjectRepository(Sheet)
        private readonly sheetRepo: Repository<Sheet>,

        @InjectRepository(SheetPosition)
        private readonly sheetPositionRepo: Repository<SheetPosition>,

        @InjectRepository(PC5MarketView)
        private readonly pc5MarketViewRepo: Repository<PC5MarketView>,

        @InjectRepository(Import)
        private readonly importRepo: Repository<Import>,

        @InjectRepository(ImportPosition)
        private readonly importPositionRepo: Repository<ImportPosition>,

        private readonly pdfService: PdfService
    ) {}

    async findSheets(padding: number, limit: number, q: string, statuses: string[]) {
        const allSheets = await this.sheetRepo.find({
            order: {
                created_at: 'DESC'
            },
        });

        let filteredSheets = allSheets;

        // Filter by statuses
        if (statuses && statuses.length > 0) {
            filteredSheets = filteredSheets.filter(sheet => {
                if (statuses.includes('open') && !sheet.closed_at) return true;
                if (statuses.includes('toBeApproved') && sheet.closed_at && !sheet.signing_at) return true;
                if (statuses.includes('finished') && sheet.closed_at && sheet.signing_at) return true;
                return false;
            });
        }

        // Filter by query
        if (q && q.trim().length > 0) {
            const queryLower = q.trim().toLowerCase().split(' ');
            filteredSheets = filteredSheets.filter(sheet =>
                queryLower.every(query => sheet.name?.toLowerCase().includes(query) || sheet.comment?.toLowerCase().includes(query))
            );
        }

        // Apply padding and limit
        const pagedSheets = filteredSheets.slice(padding, padding + limit);

        return {
            total: filteredSheets.length,
            results: pagedSheets
        };
    }

    async findDynamicPiku() {
        const results = {
            A: true,
            B: true,
            C: true,
            D: true,
            E: true,
            F: true,
            G: true
        }

        const allOpenSheet = await this.sheetRepo.find({
            where: {
                closed_at: IsNull(),
                dynamic: true
            }
        })

        const allOpenSheetNames = allOpenSheet.map(sheet => sheet.name);

        allOpenSheetNames
            .filter(name => /[A-G]$/.test(name))
            .forEach(name => {
                const nameWithoutNumbers = name.replace(/[0-9]/g, '');
                if (results.hasOwnProperty(nameWithoutNumbers)) {
                    results[nameWithoutNumbers] = false;
                }
            });

        console.log('Dynamic Piku results:', results);

        return results;
    }

    async findSheetsToSign() {
        const UsId = 7; // TODO: dynamic user id
        return this.sheetRepo.find({
            where: { signing_at: IsNull(), closed_at: Not(IsNull()), active: true, author: { id: UsId } },
            order: { created_at: 'DESC' }
        });
    }

    async findSheetsToSignPos(id: number) {
        const UsId = 7; // TODO: dynamic user id

        const sheet = await this.sheetRepo.findOne({
            where: { id, signing_at: IsNull(), closed_at: Not(IsNull()), author: { id: UsId } }
        });

        if (!sheet) {
            throw new BadRequestException(['Nie znaleziono arkusza o podanym ID.']);
        }

        const imports = await this.importRepo.find({
            where: { sheet: { id } }
        });
        const importPositions = await this.importPositionRepo.find({
            where: { import: { id: In(imports.map(i => i.id)) } },
            relations: ['import', 'sheetPosition']
        });

        const sheetPos = await this.sheetPositionRepo.find({
            where: { sheet: { id } },
            order: { productId: 'ASC' }
        });

        const productsDetails = await this.pc5MarketViewRepo.find({
            where: { TowId: In(sheetPos.map(p => p.productId)) }
        });

        sheetPos.forEach(position => {
            // Sum expectedQuantity from all importPositions for this sheetPosition
            const relatedImportPositions = importPositions.filter(
                pos => pos.sheetPosition?.id === position.id && pos.isDisabled === false
            );
            const expected = relatedImportPositions.reduce((sum, pos) => sum + (pos.expectedQuantity || 0), 0);
            const counted = relatedImportPositions.reduce((sum, pos) => sum + (pos.quantity || 0), 0);
            const exp = relatedImportPositions.length > 0 ? expected : position.expectedQuantity;

            (position as any).counted = counted;
            (position as any).expected = exp;
            (position as any).delta = counted - exp;

            // Attach productDetails from PC5MarketView
            const productDetail = productsDetails.find(p => p.TowId === position.productId);
            (position as any).onShelf = Number(((productDetail?.StockQty || 0) + (counted - exp)).toFixed(3));
            (position as any).onPcMarket = productDetail?.StockQty || 0;
            (position as any).newDelta = counted - exp;

            (position as any).TowId = productDetail ? productDetail.TowId : 0;
            (position as any).ItemName = productDetail ? productDetail.ItemName : 'Brak w PCMarket';
            (position as any).MainCode = productDetail ? productDetail.MainCode : '';
            (position as any).ExtraCodes = productDetail ? productDetail.ExtraCodes : '';
            (position as any).deltaValue = productDetail ? productDetail.RetailPrice * ((counted - exp)) : 0;
            (position as any).RetailPrice = productDetail ? productDetail.RetailPrice : 0;
        });

        return sheetPos;
    }

    async findSheetById(sheetId: number) {
        const sheet = await this.sheetRepo.findOne({
            where: { id: sheetId },
            relations: ['author', 'closed_by', 'signing_by', 'removed_by']
        });


        if (!sheet) {
            throw new BadRequestException(['Nie znaleziono arkusza o podanym ID.']);
        }

        const products = await this.sheetPositionRepo.find({
            where: { sheet: { id: sheetId } },
            order: { productId: 'ASC' }
        });

        const productsDetails = await this.pc5MarketViewRepo.find({
            where: { TowId: In(products.map(p => p.productId)) }
        });

        products.forEach(position => {
            const productDetail = productsDetails.find(p => p.TowId === position.productId);
            if (productDetail) {
                (position as any).productDetail = productDetail;
            }
        });

        const imports = await this.importRepo.find({
            where: { sheet: { id: sheetId } }
        });
        const importPos = await this.importPositionRepo.find({
            where: { import: { id: In(imports.map(i => i.id)) } },
            relations: ['import', 'sheetPosition']
        });

        imports.forEach(imp => {
            (imp as any).positions = importPos.filter(pos => pos.import.id === imp.id)
                .map(pos => {
                    const productDetail = productsDetails.find(p => p.TowId === pos.sheetPosition?.productId);
                    return {
                        ...pos,
                        productDetail,
                        delta: (pos.quantity || 0) - (pos.expectedQuantity || 0),
                        deltaValue: productDetail ? productDetail.RetailPrice * ((pos.quantity || 0) - (pos.expectedQuantity || 0)) : 0
                    };
                });
        });

        products.forEach(product => {
            const activeImportPositions = importPos.filter(pos =>
                pos.sheetPosition?.productId === product.productId &&
                pos.isDisabled === false
            );

            const expectedSum = activeImportPositions.reduce((sum, pos) => sum + (pos.expectedQuantity || 0), 0);
            const countedSum = activeImportPositions.reduce((sum, pos) => sum + (pos.quantity || 0), 0);

            (product as any).delta = countedSum - expectedSum;
            (product as any).deltaValue = (product as any).productDetail.RetailPrice * (countedSum - expectedSum)
        });

        
        return {
            basic: sheet,
            products,
            imports
        }
    }

    async createSheet(originId: number, piku: string) {   
        const originSheet = await this.sheetRepo.findOne({ where: { id: originId, temp: true, active: true } });

        if(!originSheet) return new BadRequestException(['Nie znaleziono tymczasowego arkusza o podanym ID.']);

        const productInSheetCount = await this.sheetPositionRepo.count({
            where: { sheet: { id: originId } }
        });

        const today = new Date();
        const yyyyMMdd = today.toISOString().slice(2, 10).replace(/-/g, '');

        const sheetCount = await this.sheetRepo.count({
            where: {
                name: Raw(alias => `${alias} LIKE '${piku}${yyyyMMdd}%'`)
            }
        });

        const sheetName = `${piku}${yyyyMMdd}${(sheetCount + 1).toString().padStart(3, '0')}`;

        console.log(`Creating new sheet with name: ${sheetName}`);

        originSheet.temp = false;
        originSheet.dynamic = false;
        originSheet.name = sheetName;
        await this.sheetRepo.save(originSheet);

        const filePath = await this.pdfService.generateBasicSheetPdf(originSheet.id);
        console.log(`Generated PDF for sheet ${originSheet.id}: ${filePath}`);

        // TODO: add print pdf

        return {
            id: originSheet.id,
            name: originSheet.name,
            products: productInSheetCount,
            basicPdf: {
                success: true,
                filePath
            },
            print: {
                success: true,
                printer: 'NARZEDZIA-01'
            }
        };

    }

    async createTempSheet(products: any[], countId: number, authorId: number) {
        console.log('Creating temporary sheet with products:', products);

        const pass: Array<PC5MarketView> = []
        const notActive: Array<PC5MarketView> = []
        const used: Array<any> = []
        const notFound: Array<Number> = []

        const productsInDb = await this.pc5MarketViewRepo.find({
            where: { TowId: In(products) },
        });

        const productIdsInDb = new Set(productsInDb.map(product => product.TowId));
        const activeProducts = productsInDb.filter(product => product.IsActive);

        const sheetPositions = await this.sheetPositionRepo.find({
            where: {
                productId: In(activeProducts.map(product => product.TowId)),
                isDisabled: false,
                sheet: {
                    count: { id: countId },
                    mainCount: true
                }
            },
            relations: ['sheet'],
        });

        const sheetPositionMap = new Map();
        sheetPositions.filter(el => el.isDisabled === false).filter(el => el.sheet.active === true).forEach(sheet => {
            sheetPositionMap.set(sheet.productId, sheet);
        });

        for (const product of products) {
            if (productIdsInDb.has(product)) {
                const productInDb = productsInDb.find(p => p.TowId === product);
                if (productInDb && productInDb.IsActive) {
                    const isInSheet = sheetPositionMap.get(product);
                    if (isInSheet) {
                        used.push({
                            ...productInDb,
                            inSheet: isInSheet,
                        });
                    } else {
                        pass.push(productInDb);
                    }
                } else {
                    notActive.push(productInDb as PC5MarketView);
                }
            } else {
                notFound.push(product);
            }
        }

        console.log('Sheet creation summary:');
        console.log('Passed products:', pass.length);
        console.log('Not active products:', notActive.length);
        console.log('Used products:', used.length);
        console.log('Not found products:', notFound.length);

        if (pass.length > 0) {
            const sheetCount = await this.sheetRepo.count({ where: { count: { id: countId } } });

            const newSheet = this.sheetRepo.create({
                temp: true,
                count: { id: countId },
                mainCount: true,
                active: true,
                name: `Temporary Sheet - ${sheetCount + 1}`,
                comment: '',
                dynamic: false,
                author: { id: authorId },
                created_at: new Date()
            });
            await this.sheetRepo.save(newSheet);

            const positions = pass.map(product => {
                return this.sheetPositionRepo.create({
                    productId: product.TowId,
                    sheet: newSheet,
                    expectedQuantity: product.StockQty,
                    isDisabled: false,
                    comment: ''
                });
            });

            await this.sheetPositionRepo.save(positions);

            const sheetWithPositions = await this.sheetRepo.findOne({
                where: { id: newSheet.id }
            });

            return {
                createdSheet: true,
                sheet: sheetWithPositions,
                passed: pass.map((el) => {
                    return {
                        TowId: el.TowId,
                        ItemName: el.ItemName,
                        MainCode: el.MainCode,
                        ExtraCodes: el.ExtraCodes,
                    };
                }),
                notActive: notActive.map((el) => {
                    return {
                        TowId: el.TowId,
                        ItemName: el.ItemName,
                        MainCode: el.MainCode,
                        ExtraCodes: el.ExtraCodes,
                    };
                }),
                used: used.map((el) => {
                    return {
                        TowId: el.TowId,
                        ItemName: el.ItemName,
                        MainCode: el.MainCode,
                        ExtraCodes: el.ExtraCodes,
                    };
                }),
                notFound: notFound
            };
        } else {
            return {
                createdSheet: false,
                passed: pass,
                notActive: notActive,
                used: used,
                notFound: notFound
            }
        }
    }

    async createDynamicSheet(piku: string) {
        const countId = 3
        const author = 7;

        const today = new Date();
        const yyyyMMdd = today.toISOString().slice(2, 10).replace(/-/g, '');

        const sheetCount = await this.sheetRepo.count({
            where: {
                name: Raw(alias => `${alias} LIKE '${piku}${yyyyMMdd}%'`)
            }
        });

        const sheetName = `${yyyyMMdd}${(sheetCount + 1).toString().padStart(3, '0')}${piku}`;

        const newSheet = await this.sheetRepo.save({
            temp: false,
            count: { id: countId },
            mainCount: true,
            active: true,
            dynamic: true,
            name: sheetName,
            comment: '',
            author: { id: author },
            created_at: new Date()
        });

        const filePath = await this.pdfService.generateDynamicSheetPdf(newSheet.id);

        return {
            createdSheet: true,
            sheet: newSheet,
            filePath,
            print: {
                status: true,
                filePath
            }
        }
    }

    async closeSheet(id: number) {
        const sheet = await this.sheetRepo.findOne({ where: { id, active: true } });
        if (!sheet) throw new Error('Sheet not found');

        if (sheet.closed_at) throw new Error('Sheet is already closed');

        await this.sheetRepo.manager.transaction(async transactionalEntityManager => {
            sheet.closed_at = new Date();
            sheet.closed_by = { id: 7 } as any; // TODO: dynamic user id
            await transactionalEntityManager.save(sheet);

            const newImport = transactionalEntityManager.create(Import, {
            type: 4,
            importedAt: new Date(),
            sheet: { id },
            deviceName: 'ZAMKNIĘCIE',
            isDisabled: false,
            author: { id: 7 } // TODO: dynamic user id
            });
            await transactionalEntityManager.save(newImport);
        });
        return { success: true };
    }

    async signSheet(
        id: number,
        positions: any[]
    ) {
        const sheet = await this.sheetRepo.findOne({ where: { id, active: true } });
        if (!sheet) throw new Error('Sheet not found');

        if (sheet.signing_at) throw new Error('Sheet is already signed');

        await this.importRepo.manager.transaction(async transactionalEntityManager => {
            const imports = await transactionalEntityManager.find(Import, {
                where: { sheet: { id } }
            });
            const importPositions = await transactionalEntityManager.find(ImportPosition, {
                where: { 
                    import: { id: In(imports.map(i => i.id)) },
                    sheetPosition: { id: In(positions.map(p => p.id)) }
                }
            });

            for (const pos of importPositions) {
                pos.isDisabled = true;
            }
            await transactionalEntityManager.save(importPositions);

            const newImport = transactionalEntityManager.create(Import, {
                type: 3,
                importedAt: new Date(),
                sheet: { id },
                deviceName: 'KOREKTA',
                isDisabled: false,
                author: { id: 7 } // TODO: dynamic user id
            });
            await transactionalEntityManager.save(newImport);

            for (const pos of positions) {
                const newImportPos = transactionalEntityManager.create(ImportPosition, {
                    import: newImport,
                    sheetPosition: { id: pos.id },
                    expectedQuantity: pos.onPcMarket,
                    quantity: pos.onShelf,
                    lastChange: new Date(),
                    isDisabled: false
                });
                await transactionalEntityManager.save(newImportPos);
            }

            sheet.signing_at = new Date();
            sheet.signing_by = { id: 7 } as any; // TODO: dynamic user id
            await transactionalEntityManager.save(sheet);
        });

        return { success: true };
    }

    async deleteSheet(id: number) {
        const sheet = await this.sheetRepo.findOne({ where: { id } });
        if (!sheet) throw new Error('Sheet not found');

        const UsId = 7; // TODO: dynamic user id

        sheet.active = false;
        sheet.removed_at = new Date();
        sheet.removed_by = { id: UsId } as any;

        await this.sheetRepo.save(sheet);

        return { success: true, name: sheet.name};
    }
}