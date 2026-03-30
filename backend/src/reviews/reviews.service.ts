import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.module';
import { formatReview } from '../common/utils';

@Injectable()
export class ReviewsService {
  private Review: any;
  constructor(@Inject(SEQUELIZE) private sequelize: Sequelize) {
    this.Review = this.sequelize.model('Review');
  }

  async getReviews(query: any) {
    const { locationId } = query;
    const where: any = {};
    if (locationId) where.locationId = parseInt(locationId);
    const reviews = await this.Review.findAll({ where, order: [['createdAt', 'DESC']], raw: true });
    return reviews.map(formatReview);
  }

  async createReview(userId: number, dto: any) {
    const review = await this.Review.create({ ...dto, userId });
    return formatReview(review.toJSON());
  }

  async deleteReview(id: string, userId: number, isAdmin: boolean) {
    const where: any = { id: parseInt(id) };
    if (!isAdmin) where.userId = userId;
    const review = await this.Review.findOne({ where });
    if (!review) throw new NotFoundException('Review not found');
    await review.destroy();
    return { message: 'Review deleted' };
  }
}
