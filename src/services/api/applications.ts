import { apiClient } from './client';

export const applicationsApi = {
  getAll: async (params?: any) => {
    const res = await apiClient.get('/applications/', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/applications/${id}/`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/applications/', data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.put(`/applications/${id}/`, data);
    return res.data;
  },
  getFee: async (id: string) => {
    const res = await apiClient.get(`/applications/${id}/fee/`);
    return res.data;
  },
  uploadDocument: (id: string, formData: FormData) => {
    return apiClient.post(`/applications/${id}/documents/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: [(data) => data],
    });
  },
  deleteDocument: async (id: string, docId: string) => {
    const res = await apiClient.delete(`/applications/${id}/documents/${docId}/`);
    return res.data;
  },
  getRequiredDocs: async (id: string) => {
    const res = await apiClient.get(`/applications/${id}/required-documents/`);
    return res.data;
  },
  addNeighbor: async (id: string, data: FormData) => {
    const res = await apiClient.post(`/applications/${id}/neighbors/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  deleteNeighbor: async (id: string, neighborId: string) => {
    const res = await apiClient.delete(`/applications/${id}/neighbors/${neighborId}/`);
    return res.data;
  },
  submit: async (id: string) => {
    const res = await apiClient.post(`/applications/${id}/submit/`);
    return res.data;
  },
  getTimeline: async (id: string) => {
    const res = await apiClient.get(`/applications/${id}/timeline/`);
    return res.data;
  },

  // PAYMENT API ENDPOINTS

  // Get invoice details
  getInvoice: async (invoiceId: string) => {
    const res = await apiClient.get(`/payments/invoices/${invoiceId}/`);
    return res.data;
  },

  // Pay invoice
  payInvoice: async (invoiceId: string, paymentMethod: string) => {
    const res = await apiClient.post(`/payments/invoices/${invoiceId}/pay/`, {
      payment_method: paymentMethod
    });
    return res.data;
  },

  // Upload bank receipt
  uploadBankReceipt: async (invoiceId: string, receiptFile: File) => {
    const formData = new FormData();
    formData.append('receipt', receiptFile);

    const res = await apiClient.post(`/payments/invoices/${invoiceId}/bank-receipt/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Download receipt
  getReceipt: async (paymentUuid: string) => {
    const res = await apiClient.get(`/payments/receipts/${paymentUuid}/`, {
      responseType: 'blob'
    });
    return res.data;
  },

  // Admin: Confirm payment
  confirmPayment: async (invoiceId: string) => {
    const res = await apiClient.put(`/payments/invoices/${invoiceId}/confirm/`);
    return res.data;
  },

  // Admin: List all payments
  listPayments: async (params?: any) => {
    const res = await apiClient.get('/payments/', { params });
    return res.data;
  },

  // Add this method to your applicationsApi
  getInvoiceByApplication: async (applicationId: string) => {
    // Try to get invoice by application ID
    const res = await apiClient.get(`/payments/invoices/?application_id=${applicationId}`);
    return res.data;
  },

  // Get permit details
  getPermit: async (permitNumber: string) => {
    const res = await apiClient.get(`/permits/${permitNumber}/`);
    return res.data;
  },

  getPermitByApplicationId: async (applicationId: string) => {
    const res = await apiClient.get(`/applications/${applicationId}/permits/`);
    return res.data;
  },

  downloadPermitDocument: async (permitNumber: string) => {
    const res = await apiClient.get(`/permits/${permitNumber}/download/`, {
      responseType: 'blob'
    });
    return res.data;
  },
};