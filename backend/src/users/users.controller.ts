import { Controller, Get, Put, Body, Req, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { AdminGuard } from '../auth/guards';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    return { success: true, data: await this.svc.getProfile(req.user.id) };
  }

  @Put('profile')
  async updateProfile(@Req() req: any, @Body() body: any) {
    return { success: true, data: await this.svc.updateProfile(req.user.id, body) };
  }

  @Get()
  @UseGuards(AdminGuard)
  async getAllUsers(@Query() query: any) {
    return { success: true, data: await this.svc.getAllUsers(query) };
  }
}
