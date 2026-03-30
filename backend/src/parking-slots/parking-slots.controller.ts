import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ParkingSlotsService } from './parking-slots.service';
import { AdminGuard } from '../auth/guards';

@Controller('parking-slots')
@UseGuards(AuthGuard('jwt'))
export class ParkingSlotsController {
  constructor(private readonly svc: ParkingSlotsService) {}

  @Get('location/:locationId')
  async getSlotsByLocation(@Param('locationId') id: string) {
    const data = await this.svc.getSlotsByLocation(id);
    return { success: true, data };
  }

  @Get('available/:locationId')
  async getAvailableSlots(@Param('locationId') id: string, @Query('date') date: string, @Query('timeSlot') timeSlot: string) {
    const data = await this.svc.getAvailableSlots(id, date, timeSlot);
    return { success: true, data };
  }

  @Get('dashboard/:locationId')
  async getDashboardSlots(@Param('locationId') id: string, @Query('date') date: string) {
    const result = await this.svc.getDashboardSlots(id, date);
    return { success: true, ...result };
  }

  @Get(':id')
  async getSlot(@Param('id') id: string) {
    const data = await this.svc.getSlot(id);
    return { success: true, data };
  }

  @Post('generate')
  @UseGuards(AdminGuard)
  async generateSlots(@Body() body: any) {
    const result = await this.svc.generateSlots(body);
    return { success: true, data: result.slots, message: result.message };
  }

  @Post()
  @UseGuards(AdminGuard)
  async createSlot(@Body() body: any) {
    const data = await this.svc.createSlot(body);
    return { success: true, data };
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async updateSlot(@Param('id') id: string, @Body() body: any) {
    const data = await this.svc.updateSlot(id, body);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteSlot(@Param('id') id: string) {
    const data = await this.svc.deleteSlot(id);
    return { success: true, data };
  }
}
