import { Injectable, Inject } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.module';

@Injectable()
export class SettingsService {
  private Settings: any;
  constructor(@Inject(SEQUELIZE) private sequelize: Sequelize) {
    this.Settings = this.sequelize.model('Settings');
  }
  async getAll() {
    return this.Settings.findAll({ raw: true });
  }
  async upsert(key: string, value: any) {
    const [setting] = await this.Settings.findOrCreate({ where: { key }, defaults: { key, value } });
    if (setting.value !== value) await setting.update({ value });
    return setting.toJSON();
  }
}
