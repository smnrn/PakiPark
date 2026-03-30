import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
@UseGuards(AuthGuard('jwt'))
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  async getMyVehicles(@Req() req: any) {
    const vehicles = await this.vehiclesService.getMyVehicles(req.user.id);
    return { success: true, data: vehicles };
  }

  @Post()
  async createVehicle(@Req() req: any, @Body() body: any) {
    const vehicle = await this.vehiclesService.createVehicle(req.user.id, body);
    return { success: true, data: vehicle };
  }

  @Put(':id')
  async updateVehicle(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    const vehicle = await this.vehiclesService.updateVehicle(id, req.user.id, body);
    return { success: true, data: vehicle };
  }

  @Delete(':id')
  async deleteVehicle(@Param('id') id: string, @Req() req: any) {
    const result = await this.vehiclesService.deleteVehicle(id, req.user.id);
    return { success: true, data: result };
  }

  @Patch(':id/default')
  async setDefault(@Param('id') id: string, @Req() req: any) {
    const result = await this.vehiclesService.setDefault(id, req.user.id);
    return { success: true, data: result };
  }
}
