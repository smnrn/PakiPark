import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.module';

@Injectable()
export class LocationsService {
  private Location: any;
  private Booking: any;

  constructor(@Inject(SEQUELIZE) private sequelize: Sequelize) {
    this.Location = this.sequelize.model('Location');
    this.Booking  = this.sequelize.model('Booking');
  }

  private async recomputeAvailableSpots(locationId: number, totalSpots: number) {
    const activeCount = await this.Booking.count({ where: { locationId, status: { [Op.in]: ['upcoming', 'active'] } } });
    return Math.max(0, totalSpots - activeCount);
  }

  async getLocations(query: any) {
    const { search } = query;
    const where: any = {};
    if (search) where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { address: { [Op.iLike]: `%${search}%` } }];
    const locations = await this.Location.findAll({ where, order: [['name', 'ASC']] });
    return Promise.all(locations.map(async (loc: any) => {
      const json: any = loc.toJSON();
      json.availableSpots = await this.recomputeAvailableSpots(loc.id, loc.totalSpots);
      return json;
    }));
  }

  async getLocation(id: string) {
    const location = await this.Location.findByPk(parseInt(id));
    if (!location) throw new NotFoundException('Location not found');
    const json: any = location.toJSON();
    json.availableSpots = await this.recomputeAvailableSpots(location.id, location.totalSpots);
    return json;
  }

  async createLocation(dto: any) {
    const { totalSpots, ...rest } = dto;
    const ts = parseInt(totalSpots) || 100;
    const location = await this.Location.create({ ...rest, totalSpots: ts, availableSpots: ts });
    return location.toJSON();
  }

  async updateLocation(id: string, dto: any) {
    const location = await this.Location.findByPk(parseInt(id));
    if (!location) throw new NotFoundException('Location not found');
    const updates = { ...dto };
    if (updates.totalSpots !== undefined) {
      updates.availableSpots = await this.recomputeAvailableSpots(location.id, parseInt(updates.totalSpots) || location.totalSpots);
    }
    await location.update(updates);
    const json: any = location.toJSON();
    json.availableSpots = await this.recomputeAvailableSpots(location.id, location.totalSpots);
    return json;
  }

  async deleteLocation(id: string) {
    const location = await this.Location.findByPk(parseInt(id));
    if (!location) throw new NotFoundException('Location not found');
    await location.destroy();
    return { message: 'Location deleted' };
  }
}
