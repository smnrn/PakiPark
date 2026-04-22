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

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await api.put('/users/password', { currentPassword, newPassword });
    return res;
  },

  async deleteAccount(password: string) {
    const res = await api.deleteWithBody('/users/account', { password });
    return res;
  },

  /** Customer submits PWD/Senior Citizen ID for admin review */
  async submitDiscountRequest(discountIdUrl: string, discountType: 'PWD' | 'senior_citizen') {
    const res = await api.post('/users/discount-request', { discountIdUrl, discountType });
    return res;
  },

  /** Admin: list all pending discount requests */
  async getPendingDiscounts() {
    const res = await api.get('/users/pending-discounts');
    return res.data ?? [];
  },

  /** Admin: approve or reject a discount request */
  async reviewDiscountRequest(userId: string, action: 'approve' | 'reject') {
    const res = await api.patch(`/users/${userId}/discount`, { action });
    return res;
  },

  /** Generate TOTP secret — returns { secret, otpUri } */
  async setup2FA() {
    const res = await api.post('/users/2fa/setup');
    return res.data;
  },

  /** Verify TOTP code to activate 2FA */
  async verify2FA(code: string) {
    const res = await api.post('/users/2fa/verify', { code });
    return res;
  },

  /** Disable 2FA (requires password confirmation) */
  async disable2FA(password: string) {
    const res = await api.post('/users/2fa/disable', { password });
    return res;
  },

  async getAllUsers() {
    const res = await api.get('/users');
    return res.data ?? [];
  },
};
