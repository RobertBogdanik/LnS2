import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Count, User } from 'src/database/mssql.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/config/jwt/jwt.strategy';
import { WinstonLogger } from 'src/config/winston.logger';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Count]),
    PassportModule,
    JwtModule.register({
      secret: 'your_jwt_secret',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, WinstonLogger],
  exports: [AuthService],
})

export class AuthModule {}
