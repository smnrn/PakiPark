import { api } from '../lib/api';

export const usersService = {
  async getProfile() {
    const res = await api.get('/users/profile');
    return res.data;
  },
  async updateProfile(data: any) {
    const res = await api.put('/users/profile', data);
    return res.data;
  },
  async getAllUsers() {
    const res = await api.get('/users');
    return res.data ?? [];
  },
};
