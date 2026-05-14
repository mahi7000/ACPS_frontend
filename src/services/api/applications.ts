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
  // services/api/applications.ts
  uploadDocument: (id: string, formData: FormData) => {
    return apiClient.post(`/applications/${id}/documents/`, formData, {
      headers: {
        // We explicitly tell Axios NOT to set a content type 
        // by deleting it from this specific request's config
        'Content-Type': 'multipart/form-data',
      },
      // This tells Axios not to transform the request body at all
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
  // Get invoice for an application (creates one if not exists)
  getOrCreateInvoice: async (applicationId: string) => {
    try {
      // First try to get existing invoice
      const response = await apiClient.get(`/applications/${applicationId}/invoice/`);
      return response.data;
    } catch (error: any) {
      // If invoice doesn't exist (404), try to create one
      if (error.response?.status === 404) {
        try {
          const createResponse = await apiClient.post(`/applications/${applicationId}/create-invoice/`);
          return createResponse.data;
        } catch (createError: any) {
          // If creation also fails, throw a more descriptive error
          if (createError.response?.status === 404) {
            throw new Error('Application not found or not yet submitted');
          }
          throw createError;
        }
      }
      throw error;
    }
  },

  // Get payment status
  getPaymentStatus: async (applicationId: string) => {
    const response = await apiClient.get(`/applications/${applicationId}/payment-status/`);
    return response.data;
  }
};