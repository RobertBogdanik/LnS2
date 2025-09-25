import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ViewEntity, ViewColumn, JoinColumn, View } from 'typeorm';

// Users Table
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  card: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'A' })
  defaultPiku: string;
}

// Counts Table
@Entity('counts')
export class Count {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'datetime', nullable: true })
  closed_at: Date | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  open_at: Date;

  @Column({ type: 'datetime', nullable: true })
  final_at: Date | null;
}

// Sheets Table
@Entity('sheets')
export class Sheet {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Count, (count) => count.id)
  @JoinColumn({ name: 'count_id' })
  count: Count;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'created_by' })
  author: User;

  @Column({ type: 'bit', default: false }) // Zmiana na 'bit' dla MSSQL
  active: boolean;

  @Column({ type: 'bit', default: false }) // Zmiana na 'bit' dla MSSQL
  temp: boolean;
  
  @Column({ type: 'bit', default: false }) // Zmiana na 'bit' dla MSSQL
  dynamic: boolean;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'bit' }) // Zmiana na 'bit' dla MSSQL
  mainCount: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at?: Date;

  @Column({ type: 'datetime', nullable: true, default: () => null })
  closed_at?: Date | null;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'closed_by' })
  closed_by?: User;

  @Column({ type: 'datetime', nullable: true, default: () => null })
  signing_at?: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'signing_by' })
  signing_by?: User;

  @Column({type:'text', nullable: true, default: () => null})
  comment?: string;

  @Column({ type: 'datetime', nullable: true, default: () => null })
  removed_at?: Date | null;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'removed_by' })
  removed_by?: User;

    // sheet: { id: number; };
}

// SheetPositions Table
@Entity('sheet_positions')
export class SheetPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sheet, (sheet) => sheet.id)
  @JoinColumn({ name: 'sheet_id' })
  sheet: Sheet;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ name: 'expected_quantity', type: 'float' })
  expectedQuantity: number;

  @Column({ type: 'bit', name: 'is_disabled' }) // Zmiana na 'bit' dla MSSQL
  isDisabled: boolean;

  @Column('text')
  comment: string;
}

// Imports Table
@Entity('imports')
export class Import {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sheet, (sheet) => sheet.id)
  @JoinColumn({ name: 'sheet_id' })
  sheet: Sheet;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'imported_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  importedAt: Date;

  @Column({ name: 'device_name', type: 'nvarchar', length: 255 })
  deviceName: string;

  @Column({ name: 'is_disabled', type: 'bit' }) // Zmiana na 'bit' dla MSSQL
  isDisabled: boolean;

  @Column()
  type: number;

    // positions: { productDetail: PC5MarketView | undefined; id: number; import: Import; expectedQuantity: number; sheetPosition: SheetPosition; isDisabled: boolean; quantity: number; lastChange: Date; disabledAt?: Date; disabledBy?: User; }[];
}

// ImportPositions Table
@Entity('import_positions')
export class ImportPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Import, (importEntity) => importEntity.id)
  @JoinColumn({ name: 'import_id' })
  import: Import;

  @Column({ name: 'expected_quantity', type: 'float' })
  expectedQuantity: number;

  @ManyToOne(() => SheetPosition, (sheetPosition) => sheetPosition.id)
  @JoinColumn({ name: 'sheet_position_id' })
  sheetPosition: SheetPosition;

  @Column({ name: 'is_disabled', type: 'bit' }) // Zmiana na 'bit' dla MSSQL
  isDisabled: boolean;

  @Column({ type: 'float' })
  quantity: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  lastChange: Date;

  
  @Column({ name: 'disabled_at', type: 'datetime', nullable: true })
  disabledAt?: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'disabled_by' })
  disabledBy?: User;
}

// Exports Table
@Entity('exports')
export class Export {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Count, (count) => count.id)
  @JoinColumn({ name: 'count_id' })
  count: Count;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  exportedAt: Date;

  @Column()
  exportType: string;

  @Column({ type: 'bit' }) // Zmiana na 'bit' dla MSSQL
  isDisabled: boolean;
}

// ExportPositions Table
@Entity('export_positions')
export class ExportPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Export, (exportEntity) => exportEntity.id)
  @JoinColumn({ name: 'export_id' })
  export: Export;

  @ManyToOne(() => Sheet, (sheet) => sheet.id)
  @JoinColumn({ name: 'sheet_id' })
  sheet: Sheet;
}

// Workstations Table
@Entity('workstations')
export class Workstation {
  @PrimaryGeneratedColumn('uuid')
  UUID: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 1024 })
  configFile: string;
}

@ViewEntity({ name: 'PC5Market' })
export class PC5MarketView {
  @ViewColumn()
  TowId: number;

  @ViewColumn()
  AsoID: number;

  @ViewColumn()
  AsoName: string;

  @ViewColumn()
  ItemName: string;

  @ViewColumn()
  MainCode: string;

  @ViewColumn()
  ExtraCodes: string;

  @ViewColumn()
  StockQty: number;

  @ViewColumn()
  RetailPrice: number;

  @ViewColumn()
  AccountingPrice: number;

  @ViewColumn()
  WholesalePrice: number;

  @ViewColumn()
  IsActive: boolean;

  @ViewColumn()
  Zmiana: Date;
}

@ViewEntity({ name: 'CountProductStatus' })
export class CountProductStatusView {
  @ViewColumn()
  PosID: number;

  @ViewColumn()
  TowId: number;

  @ViewColumn()
  CountID: number;

  @ViewColumn()
  SheetId: number;

  @ViewColumn()
  SheetClose: Date;

  @ViewColumn()
  SignedAt: Date;

  @ViewColumn()
  CreatedBy: number;

  @ViewColumn()
  IsImported: boolean;

  @ViewColumn()
  LastChange: Date;
}