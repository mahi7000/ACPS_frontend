import { apiClient } from './client';

export const paymentsApi = {
  getInvoice: async (invoiceId: string) => {
    const res = await apiClient.get(`/payments/invoices/${invoiceId}/`);
    return res.data;
  },
  pay: async (invoiceId: string, data: any) => {
    const res = await apiClient.post(`/payments/invoices/${invoiceId}/pay/`, data);
    return res.data;
  },
  uploadReceipt: async (invoiceId: string, data: FormData) => {
    const res = await apiClient.post(`/payments/invoices/${invoiceId}/bank-receipt/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  downloadReceipt: async (receiptId: string) => {
    const res = await apiClient.get(`/payments/receipts/${receiptId}/`, {
      responseType: 'blob',
    });
    return res.data;
  },
};
