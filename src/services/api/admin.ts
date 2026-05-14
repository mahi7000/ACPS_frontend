import { apiClient } from './client';

export const adminApi = {
  getStats: async () => {
    // Requires an endpoint implementation or we can mock it based on spec
    const res = await apiClient.get('/admin/stats/');
    return res.data;
  },
  getUsers: async (params?: any) => {
    const res = await apiClient.get('/users/', { params });
    return res.data;
  },
  createOfficer: async (data: any) => {
    const res = await apiClient.post('/users/', data);
    return res.data;
  },
  deactivateUser: async (userId: string) => {
    const res = await apiClient.put(`/users/${userId}/deactivate/`);
    return res.data;
  },
  getPayments: async (params?: any) => {
    const res = await apiClient.get('/payments/', { params });
    return res.data;
  },
  confirmPayment: async (invoiceId: string) => {
    const res = await apiClient.put(`/payments/invoices/${invoiceId}/confirm/`);
    return res.data;
  },
  getAuditLog: async (params?: any) => {
    const res = await apiClient.get('/admin/audit-log/', { params });
    return res.data;
  },
  exportReport: async (type: string, params?: any) => {
    const res = await apiClient.get(`/admin/reports/${type}/`, {
      params,
      responseType: 'blob',
    });
    return res.data;
  },
};
