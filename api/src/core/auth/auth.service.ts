import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Count, User } from 'src/database/mssql.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { WinstonLogger } from 'src/config/winston.logger';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    
    @InjectRepository(Count)
    private readonly countRepo: Repository<Count>,

    private jwtService: JwtService,

    private readonly logger: WinstonLogger
  ) {}

  async login(loginDto: LoginDto) {
    const startTime = Date.now();
    this.logger.log(`Starting login process for card number: ${loginDto.cardNumber}`);
    this.logger.log(`Workstation: ${loginDto.workstation}`);

    const user = await this.userRepo.findOne({
      where: { card: loginDto.cardNumber, isActive: true },
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
    this.logger.log(`Login process completed in ${endTime - startTime} ms`);

    return {
      message: ['Zalogowano pomyślnie!'],
      user: user.username,
      token,
      counts,
    };
  }

  async verifyUser(UsId: number) {
    this.logger.log(`Verifying user with ID: ${UsId}`);
    const user = await this.userRepo.findOne({
      where: { id: UsId, isActive: true },
    });

    this.logger.log(`User verification result for ID ${UsId}: ${user ? 'found' : 'not found'}`);
    
    return !!user;
  }
}
