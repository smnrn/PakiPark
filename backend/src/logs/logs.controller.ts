import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LogsService } from './logs.service';
import { AdminOrTellerGuard } from '../auth/guards';

@Controller('logs')
@UseGuards(AuthGuard('jwt'), AdminOrTellerGuard)
export class LogsController {
  constructor(private readonly svc: LogsService) {}
  @Get('activity')
  async getActivityLogs(@Query() query: any) { return { success: true, data: await this.svc.getActivityLogs(query) }; }
  @Get('transactions')
  async getTransactionLogs(@Query() query: any) { return { success: true, data: await this.svc.getTransactionLogs(query) }; }
  @Post('activity')
  async logActivity(@Body() body: any) { return { success: true, data: await this.svc.logActivity(body) }; }
}
