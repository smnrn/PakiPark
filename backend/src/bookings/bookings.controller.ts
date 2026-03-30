import { Controller, Get, Post, Patch, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingsService } from './bookings.service';
import { AdminOrTellerGuard } from '../auth/guards';

@Controller('bookings')
@UseGuards(AuthGuard('jwt'))
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // POST /api/bookings
  @Post()
  async createBooking(@Req() req: any, @Body() body: any) {
    const booking = await this.bookingsService.createBooking({ userId: req.user.id, ...body });
    return { success: true, data: booking };
  }

  // GET /api/bookings/my
  @Get('my')
  async getMyBookings(@Req() req: any, @Query() query: any) {
    const result = await this.bookingsService.getMyBookings(req.user.id, query);
    return { success: true, data: result };
  }

  // GET /api/bookings/slots/:locationId
  @Get('slots/:locationId')
  async getAvailableSlots(@Param('locationId') locationId: string, @Query('date') date: string) {
    const slots = await this.bookingsService.getAvailableSlots(locationId, date);
    return { success: true, data: slots };
  }

  // GET /api/bookings   (admin/teller)
  @Get()
  @UseGuards(AdminOrTellerGuard)
  async getAllBookings(@Query() query: any) {
    const result = await this.bookingsService.getAllBookings(query);
    return { success: true, data: result };
  }

  // GET /api/bookings/:id
  @Get(':id')
  async getBookingById(@Param('id') id: string, @Req() req: any) {
    const isStaff = ['admin', 'teller', 'business_partner'].includes(req.user.role);
    const booking = await this.bookingsService.getBookingById(parseInt(id), req.user.id, isStaff);
    return { success: true, data: booking };
  }

  // PATCH /api/bookings/:id/cancel
  @Patch(':id/cancel')
  async cancelBooking(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    const booking = await this.bookingsService.cancelBooking(id, req.user.id, body.reason);
    return { success: true, data: booking };
  }

  // PATCH /api/bookings/:id/status
  @Patch(':id/status')
  @UseGuards(AdminOrTellerGuard)
  async updateBookingStatus(@Param('id') id: string, @Body() body: any) {
    const { status } = body;
    const validStatuses = ['active', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return { success: false, message: 'Invalid status. Use: active | completed | cancelled | no_show' };
    }
    const dbStatus   = status === 'no_show' ? 'cancelled' : status;
    const cancelNote = status === 'no_show' ? 'No-show'   : 'Admin action';
    const booking = await this.bookingsService.updateBookingStatus(id, dbStatus, cancelNote);
    return { success: true, data: booking };
  }

  // PATCH /api/bookings/:id/checkout
  @Patch(':id/checkout')
  @UseGuards(AdminOrTellerGuard)
  async checkOutBooking(@Param('id') id: string, @Req() req: any) {
    const result = await this.bookingsService.checkOutBooking(id, req.user.id);
    return { success: true, data: result };
  }
}
