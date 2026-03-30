import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register/customer
  @Post('register/customer')
  async registerCustomer(@Body() body: any) {
    const user = await this.authService.registerCustomer(body);
    return { success: true, data: user };
  }

  // POST /api/auth/register/admin
  @Post('register/admin')
  async registerAdmin(@Body() body: any) {
    const user = await this.authService.registerAdmin(body);
    return { success: true, data: user };
  }

  // POST /api/auth/login
  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.loginUser(body);
    return { success: true, data: user };
  }

  // GET /api/auth/me
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: any) {
    const user = await this.authService.getMe(req.user.id);
    return { success: true, data: user };
  }
}
