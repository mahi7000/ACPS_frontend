import { apiClient } from './client';

export const authApi = {
  register: async (data: any) => {
    const res = await apiClient.post('/auth/register/', data);
    return res.data;
  },
  login: async (data: any) => {
    const res = await apiClient.post('/auth/login/', data);
    return res.data;
  },
  refresh: async (data: any) => {
    const res = await apiClient.post('/auth/refresh/', data);
    return res.data;
  },
  logout: async (data: any) => {
    const res = await apiClient.post('/auth/logout/', data);
    return res.data;
  },
  forgotPassword: async (data: any) => {
    const res = await apiClient.post('/auth/forgot-password/', data);
    return res.data;
  },
  resetPassword: async (data: any) => {
    const res = await apiClient.post('/auth/reset-password/', data);
    return res.data;
  },
};
