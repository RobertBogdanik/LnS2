import { Module } from '@nestjs/common';
import { SyncModule } from './sync/sync.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { RaportsModule } from './raports/raports.module';
import { SheetModule } from './sheet/sheet.module';
import { ImportModule } from './import/import.module';
import { ProductsModule } from './products/products.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [SyncModule, AuthModule, FilesModule, RaportsModule, SheetModule, ImportModule, ProductsModule, SettingsModule]
})
export class CoreModule {}
