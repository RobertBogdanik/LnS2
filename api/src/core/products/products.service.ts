import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CountProductStatusView, Import, ImportPosition, PC5MarketView, Sheet, SheetPosition } from 'src/database/mssql.entity';
import { Brackets, In, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ProductsService {
    constructor (
        @InjectRepository(PC5MarketView)
        private readonly pc5MarketViewRepository: Repository<PC5MarketView>,
        
        @InjectRepository(SheetPosition)
        private readonly sheetPositionRepository: Repository<SheetPosition>,

        @InjectRepository(Sheet)
        private readonly sheetRepository: Repository<Sheet>,

        @InjectRepository(ImportPosition)
        private readonly importPositionRepository: Repository<ImportPosition>,

        @InjectRepository(Import)
        private readonly importRepository: Repository<Import>,

        @InjectRepository(CountProductStatusView)
        private readonly countProductStatusViewRepository: Repository<CountProductStatusView>,

        private readonly authService: AuthService
    ) {}

    sortHistory(history: any[]) {
        return history.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
    }

    async searchProducts(q: string, aso: string, status: string, UsId: number, count: number, padding: number = 0, limit: number = 50) {
        
        const userExists = await this.authService.verifyUser(UsId);
        if (!userExists) throw new BadRequestException(['Nie znaleziono użytkownika o podanym ID.']);

        // Pobierz wszystkie produkt
        const latestSheetSubQuery = this.sheetPositionRepository
      .createQueryBuilder('sp')
      .select('sp.product_id', 'product_id')
      .addSelect('MAX(s.id)', 'latest_sheet_id')
      .innerJoin('sp.sheet', 's')
      .where('sp.is_disabled = :isDisabled', { isDisabled: 0 })
      .andWhere('s.active = :active', { active: 1 })
      .andWhere('s.count_id = :countId', { countId: count })
      .groupBy('sp.product_id');

    const res =  await  this.pc5MarketViewRepository
      .createQueryBuilder('pm')
      .select([
        'pm.TowId AS TowId',
        'pm.AsoName AS AsoName',
        'pm.ItemName AS ItemName',
        'pm.MainCode AS MainCode',
        'pm.ExtraCodes AS ExtraCodes',
        'pm.IsActive AS ProductIsActive',
        's.created_at AS SheetCreatedAt',
        's.closed_at AS SheetClosedAt',
        's.signing_at AS SheetSigningAt',
        's.count_id AS SheetCountId',
        's.id AS SheetId',
        's.created_by AS SheetCreatedBy',
        's.active AS SheetActive'
      ])
      .leftJoin(
        `(${latestSheetSubQuery.getQuery()})`,
        'ls',
        'pm.TowId = ls.product_id'
      )
      .leftJoin(Sheet, 's', 'ls.latest_sheet_id = s.id')
      .setParameters(latestSheetSubQuery.getParameters())
      .orderBy('pm.ItemName', 'ASC')
      .getRawMany();

      console.log("\nInitial products fetched:", res.length, res[0]);
        let filtered = res;
        
        // 1. Sortowanie po statusie
        switch (status) {
            case "all":
                break;
            case "todo":
                filtered = filtered.filter(item => item.SheetCreatedAt == null && item.ProductIsActive == true);
                break;
            case "done":
                filtered = filtered.filter(item => item.SheetSigningAt != null);
                break;
            case "active":
                filtered = filtered.filter(item => item.ProductIsActive == true);
                break;
            case "deleted":
                filtered = filtered.filter(item => item.ProductIsActive == false);
                break;

            case "inprogress":
                filtered = filtered.filter(item => item.SheetCreatedAt != null && item.SheetClosedAt == null && item.SheetCreatedBy == UsId);
                break;
            case "pending":
                filtered = filtered.filter(item => item.SheetClosedAt != null && item.SheetSigningAt == null && item.SheetCreatedBy == UsId);
                break;
            case "mydone":
                filtered = filtered.filter(item => item.SheetSigningAt != null && item.SheetCreatedBy == UsId);
                break;
            default:
                break;
        }

        // 2. Filtrowanie po nazwie lub kodzie
        if (q && q.trim()) {
            const query = q.trim().toLowerCase();
            const words = query.split(' ');

            if (/^\d+$/.test(query)) {
                console.log("Filtering by TowId with query:", query);
                filtered = filtered.filter(item =>
                    (item.MainCode?.toString() || "").includes(query) ||
                    (item.ExtraCodes?.toLowerCase() || "").includes(query)
                );
            } else {
                filtered = filtered.filter(item => {
                    const name = (item.ItemName || "").toLowerCase();
                    return words.every(word => name.includes(word));
                });
            }
        }


        // 3. Filtrowanie po asortymencie
        if (aso) {
            filtered = filtered.filter(item => item.AsoName === aso);
        }

        const total = filtered.length;

        // 4. Sortowanie po nazwie
        filtered = filtered.sort((a, b) => (a.ItemName || '').localeCompare(b.ItemName || ''));

        // 5. Padding and limiting
        if (padding > 0) {
            filtered = filtered.slice(padding);
        }
        if (limit > 0) {
            filtered = filtered.slice(0, limit);
        }

        return {
            data: filtered,
            total: total
        };
    }

    async getAllUniqueAsos() {
        const asos = await this.pc5MarketViewRepository.createQueryBuilder('pm')
            .select('DISTINCT pm.AsoName', 'AsoName')
            .where('pm.AsoName IS NOT NULL AND pm.AsoName != \'\'')
            .orderBy('pm.AsoName', 'ASC')
            .getRawMany();
        return asos.map(a => a.AsoName);
    }

    async findOne(TowID: number, count: number) {
        const history: any[] = []

        const product = await this.pc5MarketViewRepository.findOne({ where: { TowId: TowID } });
        if (!product) return new BadRequestException(['Nie znaleziono produktu o podanym ID.']);

        const sheetPositions = await this.sheetPositionRepository.findOne({ where: { productId: TowID, sheet: { mainCount: true, active: true, count: { id: count } } }, relations: ['sheet', 'sheet.author'] });
        if (!sheetPositions) {
            return {
                basic: product,
                isInSheet: false,
                isImported: false,
                history: history
            }
        }

        history.push({
            when: sheetPositions.sheet.created_at,
            who: sheetPositions.sheet.author.username,
            where: 'Unknown',
            what: `Utworzono pozycję w arkuszu: ${sheetPositions.sheet.name}`
        });

        if (sheetPositions.sheet.closed_at) {
            history.push({
                when: sheetPositions.sheet.closed_at,
                who: sheetPositions.sheet.author.username,
                where: 'Unknown',
                what: `Zamknięto arkusz: ${sheetPositions.sheet.name}`
            });
        }

        if (sheetPositions.sheet.signing_at) {
            history.push({
                when: sheetPositions.sheet.signing_at,
                who: sheetPositions.sheet.author.username,
                where: 'Unknown',
                what: `Podpisano arkusz: ${sheetPositions.sheet.name}`
            });
        }

        const importPositions = await this.importPositionRepository.find({ where: { sheetPosition: {id: sheetPositions.id} }, relations: ['import', 'import.author'] });
        if (!importPositions) {
            return {
                basic: product,
                isInSheet: true,
                sheet: sheetPositions.sheet,
                isImported: false,
                history: this.sortHistory(history)
            }
        }

        var activeImportCounted = 0
        var activeImportExpected = 0
        importPositions.forEach(importPosition => {
            history.push({
                when: importPosition.import.importedAt,
                who: importPosition.import.author.username,
                where: 'Unknown',
                what: importPosition.import.type === 1 ? `Import delty ${importPosition.quantity-importPosition.expectedQuantity > 0 ? '+' : ''}${importPosition.quantity-importPosition.expectedQuantity} (policzono ${importPosition.quantity}, oczekiwano ${importPosition.expectedQuantity})` : `Zmiana delty na ${importPosition.quantity-importPosition.expectedQuantity > 0 ? '+' : ''}${importPosition.quantity-importPosition.expectedQuantity} (na stanie ${importPosition.quantity}, PCmarket ${importPosition.expectedQuantity})`
            });

            if (importPosition.disabledAt && importPosition.disabledBy) {
                history.push({
                    when: importPosition.disabledAt,
                    who: importPosition.disabledBy.username,
                    where: 'Unknown',
                    what: `Wykluczono import: ${importPosition.quantity}/${importPosition.expectedQuantity}`
                });
            }

            if (importPosition.import.isDisabled === false && importPosition.isDisabled === false) {
                activeImportCounted += importPosition.quantity;
                activeImportExpected += importPosition.expectedQuantity;
            }
        });

        return {
            basic: product,
            isInSheet: true,
            sheet: sheetPositions.sheet,
            isImported: true,
            quantity: {
                shelf: product.StockQty + activeImportCounted - activeImportExpected,
                pcMarket: product.StockQty,
                delta: activeImportCounted - activeImportExpected
            },
            history: this.sortHistory(history)
        }
    }

    async changeDelta(TowID: number, shelf: number, UsId: number, count: number) {
        const userExists = await this.authService.verifyUser(UsId);
        if (!userExists) throw new BadRequestException(['Nie znaleziono użytkownika o podanym ID.']);

        const product = await this.pc5MarketViewRepository.findOne({ where: { TowId: TowID } });
        if (!product) return new BadRequestException(['Nie znaleziono produktu o podanym ID.']);

        const sheetPosition = await this.sheetPositionRepository.findOne({ where: { productId: TowID, sheet: { mainCount: true, active: true, count: { id: count } } }, relations: ['sheet'] });
        if (!sheetPosition) return new BadRequestException(['Nie znaleziono pozycji arkusza dla podanego ID.']);

        const allCurrentImports = await this.importPositionRepository.find({ where: { sheetPosition: { id: sheetPosition.id } }, relations: ['import', 'import.author'] });
        if (!allCurrentImports) return new BadRequestException(['Nie znaleziono importów dla podanego ID.']);

        try {
            await this.importPositionRepository.manager.transaction(async transactionalEntityManager => {
                // Disable all current imports
                for (const importPosition of allCurrentImports) {
                    importPosition.isDisabled = true;
                    importPosition.disabledAt = new Date();
                    importPosition.disabledBy = { id: UsId } as any;
                    importPosition.lastChange = new Date();
                    await transactionalEntityManager.save(ImportPosition, importPosition);
                }

                // Create new import
                const newImport = await transactionalEntityManager.save(Import, {
                    type: 2,
                    importedAt: new Date(),
                    deviceName: 'delta',
                    sheet: sheetPosition.sheet,
                    author: { id: UsId } as any,
                    isDisabled: false
                });

                // Create new import position
                const newImportPos = transactionalEntityManager.create(ImportPosition, {
                    import: newImport,
                    sheetPosition: sheetPosition,
                    quantity: shelf,
                    expectedQuantity: product.StockQty,
                    isDisabled: false,
                    lastChange: new Date()
                });

                await transactionalEntityManager.save(ImportPosition, newImportPos);
            });

            return await this.findOne(TowID, count);
        } catch (error) {
            console.error('Error changing delta:', error);
            return new BadGatewayException(['Wystąpił błąd podczas zmiany delty.']);
        }
    }
}
