import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { AdminOrTellerGuard } from '../auth/guards';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'), AdminOrTellerGuard)
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Query() query: any) {
    const data = await this.svc.getOverview(query);
    return { success: true, data };
  }
}
