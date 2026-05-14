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
  uploadDocument: async (id: string, data: FormData) => {
    const res = await apiClient.post(`/applications/${id}/documents/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
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
};
