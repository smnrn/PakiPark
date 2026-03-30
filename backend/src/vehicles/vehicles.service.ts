import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.module';

@Injectable()
export class VehiclesService {
  private Vehicle: any;
  constructor(@Inject(SEQUELIZE) private sequelize: Sequelize) {
    this.Vehicle = this.sequelize.model('Vehicle');
  }

  async getMyVehicles(userId: number) {
    const vehicles = await this.Vehicle.findAll({ where: { userId }, order: [['isDefault', 'DESC'], ['createdAt', 'DESC']] });
    return vehicles.map((v: any) => v.toJSON());
  }

  async createVehicle(userId: number, dto: any) {
    const vehicle = await this.Vehicle.create({ ...dto, userId });
    return vehicle.toJSON();
  }

  async updateVehicle(id: string, userId: number, dto: any) {
    const vehicle = await this.Vehicle.findOne({ where: { id: parseInt(id), userId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    await vehicle.update(dto);
    return vehicle.toJSON();
  }

  async deleteVehicle(id: string, userId: number) {
    const vehicle = await this.Vehicle.findOne({ where: { id: parseInt(id), userId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    await vehicle.destroy();
    return { message: 'Vehicle deleted' };
  }

  async setDefault(id: string, userId: number) {
    await this.Vehicle.update({ isDefault: false }, { where: { userId } });
    await this.Vehicle.update({ isDefault: true  }, { where: { id: parseInt(id), userId } });
    return { message: 'Default vehicle updated' };
  }
}
