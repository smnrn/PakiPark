import { Injectable, Inject } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.module';

@Injectable()
export class LogsService {
  private ActivityLog: any;
  private TransactionLog: any;

  constructor(@Inject(SEQUELIZE) private sequelize: Sequelize) {
    this.ActivityLog    = this.sequelize.model('ActivityLog');
    this.TransactionLog = this.sequelize.model('TransactionLog');
  }

  async getActivityLogs(query: any) {
    const { adminId, action, page = 1, limit = 20 } = query;
    const where: any = {};
    if (adminId) where.adminId = parseInt(adminId);
    if (action)  where.action  = action;
    const { rows: logs, count: total } = await this.ActivityLog.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    });
    return { logs: logs.map((l: any) => l.toJSON()), total, page: parseInt(page) };
  }

  async getTransactionLogs(query: any) {
    const { bookingId, userId, page = 1, limit = 20 } = query;
    const where: any = {};
    if (bookingId) where.bookingId = parseInt(bookingId);
    if (userId)    where.userId    = parseInt(userId);
    const { rows: logs, count: total } = await this.TransactionLog.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    });
    return { logs: logs.map((l: any) => l.toJSON()), total, page: parseInt(page) };
  }

  async logActivity(dto: any) {
    const log = await this.ActivityLog.create(dto);
    return log.toJSON();
  }
}
