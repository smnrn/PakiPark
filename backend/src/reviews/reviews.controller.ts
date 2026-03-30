import { Controller, Get, Post, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  @Get()
  async getReviews(@Query() query: any) {
    const data = await this.svc.getReviews(query);
    return { success: true, data };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createReview(@Req() req: any, @Body() body: any) {
    const data = await this.svc.createReview(req.user.id, body);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteReview(@Param('id') id: string, @Req() req: any) {
    const isAdmin = req.user?.role === 'admin';
    const data = await this.svc.deleteReview(id, req.user.id, isAdmin);
    return { success: true, data };
  }
}
