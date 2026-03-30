import { api } from '../lib/api';

export const vehiclesService = {
  async getMyVehicles() {
    const res = await api.get('/vehicles/my');
    return res.data ?? [];
  },
  async addVehicle(data: any) {
    const res = await api.post('/vehicles', data);
    return res.data;
  },
  async updateVehicle(id: string, data: any) {
    const res = await api.put(`/vehicles/${id}`, data);
    return res.data;
  },
  async deleteVehicle(id: string) {
    const res = await api.delete(`/vehicles/${id}`);
    return res.data;
  },
};
