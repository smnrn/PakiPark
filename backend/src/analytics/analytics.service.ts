import { Injectable, Inject } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.module';

@Injectable()
export class AnalyticsService {
  private Booking: any;
  private User: any;
  private Location: any;

  constructor(@Inject(SEQUELIZE) private sequelize: Sequelize) {
    this.Booking  = this.sequelize.model('Booking');
    this.User     = this.sequelize.model('User');
    this.Location = this.sequelize.model('Location');
  }

  async getOverview(query: any) {
    const { locationId, startDate, endDate } = query;
    const where: any = {};
    if (locationId) where.locationId = parseInt(locationId);
    if (startDate)  where.date = { [Op.gte]: startDate };
    if (endDate)    where.date = { ...where.date, [Op.lte]: endDate };

    const [total, upcoming, active, completed, cancelled] = await Promise.all([
      this.Booking.count({ where }),
      this.Booking.count({ where: { ...where, status: 'upcoming' } }),
      this.Booking.count({ where: { ...where, status: 'active' } }),
      this.Booking.count({ where: { ...where, status: 'completed' } }),
      this.Booking.count({ where: { ...where, status: 'cancelled' } }),
    ]);

    return { total, upcoming, active, completed, cancelled };
  }
}
