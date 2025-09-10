import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Count, PC5MarketView, User, Workstation } from 'src/database/mssql.entity';
import { MoreThan, Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    
    @InjectRepository(Count)
    private readonly countRepo: Repository<Count>,


    private jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto) {
    const startImer = Date.now();
    this.logger.log(`Login attempt for user: ${loginDto.cardNumber}`);
    this.logger.log(`Workstation name: ${loginDto.workstation}`);
    this.logger.log(`Last update: ${loginDto.lastUpdate}`);

    const user = await this.userRepo.findOne({
      where: { card: loginDto.cardNumber },
    });

    if (!user) {
      this.logger.warn(`User with card number ${loginDto.cardNumber} not found.`);
      throw new BadRequestException(['Nie znaleziono użytkownika z podanym numerem karty.']);
    }

    const jwtPayload = {
      usid: user.id,
      userName: user.username,
      isAdmin: user.isAdmin
    };

    const token = this.jwtService.sign(jwtPayload);

    const counts = await this.countRepo.find();
    this.logger.log(`Found counts: ${JSON.stringify(counts)}`);

    const endTime = Date.now();
    this.logger.log(`Login process completed in ${endTime - startImer} ms`);

    return {
      message: ['Zalogowano pomyślnie!'],
      user: user.username,
      token,
      counts,
    };

  }
}
