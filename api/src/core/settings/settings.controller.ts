import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService
  ) {}

  @Get('users')
  async getAllUsers() {
    return await this.settingsService.getAllUsers();
  }

  @Get('counts')
  async getAllCounts() {
    return await this.settingsService.getAllCounts();
  }

  @Post('user')
  async createUser(
    @Body() body: any
  ) {
    return await this.settingsService.createUser(body);
  }

  @Post('count')
  async createCount(@Body() body: any) {
    return await this.settingsService.createCount(body);
  }

  @Put('user/:id')
  async updateUser(@Param('id') id: number, @Body() body: any) {
    return await this.settingsService.updateUser(id, body);
  }

  @Put('count/:id')
  async updateCount(@Param('id') id: number, @Body() body: any) {
    return await this.settingsService.updateCount(id, body);
  }

  @Delete('user/:id')
  async deleteUser(@Param('id') id: number) {
    return await this.settingsService.deleteUser(id);
  }
}
