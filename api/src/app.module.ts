import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Count, CountProductStatusView, Export, ExportPosition, Import, ImportPosition, PC5MarketView, Sheet, SheetPosition, User, Workstation } from './database/mssql.entity';
import { CoreModule } from './core/core.module';
import { SysConfigModule } from './config/sysconfig.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { ConfigModule } from '@nestjs/config';
import { CronModule } from './module/cron/cron.module';
import { HeadersMiddleware } from './middleware/headers.middleware';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST || '192.168.1.203',
      port: 1433,
      username: process.env.DB_USERNAME || 'LNS',
      password: process.env.DB_PASSWORD || 'zxc',
      database: process.env.DB_NAME || 'LnS2',
      synchronize: false,
      entities: [User, Count, Sheet, SheetPosition, Import, ImportPosition, Export, ExportPosition, Workstation, PC5MarketView, CountProductStatusView],
      migrations: [],
      subscribers: [],
      extra: {
        trustServerCertificate: true
      },
      options: {
        encrypt: false,
        enableArithAbort: true,
      },
    }),
    CoreModule,
    SysConfigModule,
    PdfModule,
    CronModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecretKey',
      signOptions: { expiresIn: '365d' },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HeadersMiddleware)
      .forRoutes('*');
  }
}