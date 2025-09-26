import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { RaportsModule } from './raports/raports.module';
import { SheetModule } from './sheet/sheet.module';
import { ImportModule } from './import/import.module';
import { ProductsModule } from './products/products.module';
import { SettingsModule } from './settings/settings.module';
import { ExportModule } from './export/export.module';

@Module({
  imports: [AuthModule, FilesModule, RaportsModule, SheetModule, ImportModule, ProductsModule, SettingsModule, ExportModule]
})
export class CoreModule {}
