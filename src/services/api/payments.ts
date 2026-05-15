import { apiClient } from './client';

export const paymentsApi = {
  // Get invoice details
  getInvoice: async (invoiceId: string) => {
    const res = await apiClient.get(`/payments/invoices/${invoiceId}/`);
    return res.data;
  },

  // Pay invoice
  pay: async (invoiceId: string, data: { payment_method: string }) => {
    const res = await apiClient.post(`/payments/invoices/${invoiceId}/pay/`, data);
    return res.data;
  },

  // Upload bank receipt
  uploadReceipt: async (invoiceId: string, formData: FormData) => {
    const res = await apiClient.post(`/payments/invoices/${invoiceId}/bank-receipt/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Download receipt PDF
  getReceipt: async (paymentUuid: string) => {
    const res = await apiClient.get(`/payments/receipts/${paymentUuid}/`, {
      responseType: 'blob'
    });
    return res.data;
  },

  // Admin: Confirm bank transfer payment
  confirmPayment: async (invoiceId: string) => {
    const res = await apiClient.put(`/payments/invoices/${invoiceId}/confirm/`);
    return res.data;
  },

  // Admin: List all payments with filters
  listPayments: async (params?: {
    status?: string;
    method?: string;
    page?: number;
    page_size?: number;
  }) => {
    const res = await apiClient.get('/payments/', { params });
    return res.data;
  }
};