import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WinstonLogger } from 'src/config/winston.logger';
import { Count, User } from 'src/database/mssql.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Count)
        private readonly countRepo: Repository<Count>,
        
        private readonly logger: WinstonLogger
    ) {}

    async getAllUsers() {
        this.logger.log('Fetching all users');
        return await this.userRepo.find({
            where: { isActive: true }
        });
    }

    async getAllCounts() {
        this.logger.log('Fetching all counts');
        return await this.countRepo.find({
            where: { is_active: true }
        });
    }

    async createUser(body: any) {
        this.logger.log('Creating new user');
        const newUser = this.userRepo.create({
            username: body.username,
            card: body.card,
            isAdmin: body.isAdmin || false,
            isActive: true, 
            created_at: new Date(),
            defaultPiku: body.defaultPiku || 'A'
        });

        this.logger.log(`User created: ${newUser.username} [${newUser.id}]`);

        return await this.userRepo.save(newUser);
    }

    async createCount(body: any) {
        this.logger.log('Creating new count');
        const newCount = this.countRepo.create({
            name: body.name || 'Nowe liczenie',
            is_active: true,
            open_at: new Date(body.open_at) || new Date(),
            closed_at: body.closed_at ? new Date(body.closed_at) : null,
            final_at: body.final_at ? new Date(body.final_at) : null
        });

        this.logger.log(`Count created: ${newCount.name} [${newCount.id}]`);

        return await this.countRepo.save(newCount);
    }

    async updateUser(id: number, body: any) {
        const user = await this.userRepo.findOne({
            where: { id: id, isActive: true }
        });
        if (!user) {
            this.logger.error(`User not found: ${id}`);
            throw new BadRequestException('User not found');
        }

        user.username = body.username ?? user.username;
        user.card = body.card ?? user.card;
        user.isAdmin = body.isAdmin ?? user.isAdmin;
        user.isActive = body.isActive ?? user.isActive;
        user.defaultPiku = body.defaultPiku ?? user.defaultPiku;

        this.logger.log(`Updating user: ${user.username} [${user.id}]`);

        return await this.userRepo.save(user);
    }

    async updateCount(id: number, body: any) {
        const count = await this.countRepo.findOne({
            where: { id: id, is_active: true }
        });
        if (!count) {
            this.logger.error(`Count not found: ${id}`);
            throw new BadRequestException('Count not found');
        }

        count.name = body.name ?? count.name;
        count.open_at = body.open_at ? new Date(body.open_at) : count.open_at;
        count.closed_at = body.closed_at ? new Date(body.closed_at) : null;
        count.final_at = body.final_at ? new Date(body.final_at) : null;

        this.logger.log(`Updating count: ${count.name} [${count.id}]`);

        return await this.countRepo.save(count);
    }

    async deleteUser(id: number) {
        const user = await this.userRepo.findOne({
            where: { id: id, isActive: true }
        });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        user.isActive = false;

        this.logger.log(`Deactivating user: ${user.username} [${user.id}]`);
        
        return await this.userRepo.save(user);
    }
}
