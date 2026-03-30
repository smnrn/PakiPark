import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.module';

@Injectable()
export class UsersService {
  private User: any;
  constructor(@Inject(SEQUELIZE) private sequelize: Sequelize) {
    this.User = this.sequelize.model('User');
  }
  async getProfile(userId: number) {
    const user = await this.User.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
    return user.toJSON();
  }
  async updateProfile(userId: number, dto: any) {
    const user = await this.User.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
    const allowed = ['name', 'phone', 'address', 'dateOfBirth', 'profilePicture'];
    const updates: any = {};
    allowed.forEach(k => { if (dto[k] !== undefined) updates[k] = dto[k]; });
    await user.update(updates);
    return user.toJSON();
  }
  async getAllUsers(query: any) {
    const users = await this.User.findAll({ order: [['createdAt', 'DESC']] });
    return users.map((u: any) => u.toJSON());
  }
}
