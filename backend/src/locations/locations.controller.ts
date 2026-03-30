import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocationsService } from './locations.service';
import { AdminGuard } from '../auth/guards';

@Controller('locations')
export class LocationsController {
  constructor(private readonly svc: LocationsService) {}

  @Get()
  async getLocations(@Query() query: any) {
    const data = await this.svc.getLocations(query);
    return { success: true, data };
  }

  @Get(':id')
  async getLocation(@Param('id') id: string) {
    const data = await this.svc.getLocation(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async createLocation(@Body() body: any) {
    const data = await this.svc.createLocation(body);
    return { success: true, data };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async updateLocation(@Param('id') id: string, @Body() body: any) {
    const data = await this.svc.updateLocation(id, body);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async deleteLocation(@Param('id') id: string) {
    const data = await this.svc.deleteLocation(id);
    return { success: true, data };
  }
}
