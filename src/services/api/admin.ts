import { apiClient } from './client';

export const adminApi = {
  // Stats
  getStats: async (params?: any) => {
    const res = await apiClient.get('/admin/stats/', { params });
    return res.data;
  },
  
  // Users
  getUser: async (userId: string) => {
    const res = await apiClient.get(`/users/${userId}/`);
    return res.data;
  },
  getUsers: async (params?: any) => {
    const res = await apiClient.get('/users/', { params });
    return res.data;
  },
  getReviewOfficers: async () => {
    const res = await apiClient.get('/users/', { params: { role: 'REVIEW_OFFICER', status: 'ACTIVE' } });
    return res.data;
  },
  createOfficer: async (data: any) => {
    const res = await apiClient.post('/users/', data);
    return res.data;
  },
  deactivateUser: async (userId: string, data: { reason: string; reassign_open_applications_to?: string }) => {
    const res = await apiClient.put(`/users/${userId}/deactivate/`, data);
    return res.data;
  },

  // Applications
  getAllApplications: async (params?: any) => {
    const res = await apiClient.get('/applications/', { params });
    return res.data;
  },
  assignReviewer: async (applicationId: string, data: { assigned_officer_id: string; reason?: string; previous_officer_id?: string }) => {
    const res = await apiClient.post(`/applications/${applicationId}/assign-reviewer/`, data);
    return res.data;
  },

  // Reviews & SLA
  getSlaStatus: async (params?: any) => {
    const res = await apiClient.get('/reviews/sla-status/', { params });
    return res.data;
  },

  // Payments
  getPayments: async (params?: any) => {
    const res = await apiClient.get('/payments/', { params });
    return res.data;
  },
  confirmPayment: async (invoiceId: string, data: { transaction_reference: string; confirmed_amount: number; notes?: string }) => {
    const res = await apiClient.put(`/payments/invoices/${invoiceId}/confirm/`, data);
    return res.data;
  },

  // Audit Log
  getAuditLog: async (params?: any) => {
    const res = await apiClient.get('/admin/audit-log/', { params });
    return res.data;
  },

  // Reports
  exportReport: async (params: { report_type: string; date_from: string; date_to: string; format: string; subcity_id?: string }) => {
    const res = await apiClient.get('/admin/reports/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },

  // Config
  updateFeeSchedule: async (data: any) => {
    const res = await apiClient.put('/admin/config/fee-schedule/', data);
    return res.data;
  },
  updateSlaThresholds: async (data: any) => {
    const res = await apiClient.put('/admin/config/sla-thresholds/', data);
    return res.data;
  },
  updateInspectionChecklist: async (type: string, data: any) => {
    const res = await apiClient.put(`/admin/config/inspection-checklists/${type}/`, data);
    return res.data;
  },
  updateNotificationTemplate: async (data: any) => {
    const res = await apiClient.post('/admin/config/notification-templates/', data);
    return res.data;
  },
};
