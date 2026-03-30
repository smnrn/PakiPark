import { api } from '../lib/api';

export const locationsService = {
  async getLocations(params?: any) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await api.get(`/locations${q}`);
    return res.data ?? [];
  },
  async getLocation(id: string) {
    const res = await api.get(`/locations/${id}`);
    return res.data;
  },
  async createLocation(data: any) {
    const res = await api.post('/locations', data);
    return res.data;
  },
  async updateLocation(id: string, data: any) {
    const res = await api.put(`/locations/${id}`, data);
    return res.data;
  },
  async deleteLocation(id: string) {
    const res = await api.delete(`/locations/${id}`);
    return res.data;
  },
};
