import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { AdminGuard } from '../auth/guards';

@Controller('settings')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}
  @Get()
  async getAll() { return { success: true, data: await this.svc.getAll() }; }
  @Put()
  async upsert(@Body() body: any) { return { success: true, data: await this.svc.upsert(body.key, body.value) }; }
}
