import { apiClient } from './client';

export const inspectionsApi = {
  commence: async (applicationId: string, data: any) => {
    const res = await apiClient.post(`/applications/${applicationId}/commence/`, data);
    return res.data;
  },
  declareCompletion: async (applicationId: string, data: FormData) => {
    const res = await apiClient.post(`/applications/${applicationId}/declare-completion/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getApplicationInspections: async (applicationId: string) => {
    const res = await apiClient.get(`/applications/${applicationId}/inspections/`);
    return res.data;
  },
  requestReinspection: async (applicationId: string, inspectionId: string, data: any) => {
    const res = await apiClient.post(`/applications/${applicationId}/inspections/${inspectionId}/request-reinspection/`, data);
    return res.data;
  },
  getSchedule: async () => {
    const res = await apiClient.get('/inspections/my-schedule/');
    return res.data;
  },
  getById: async (inspectionId: string) => {
    const res = await apiClient.get(`/inspections/${inspectionId}/`);
    return res.data;
  },
  start: async (inspectionId: string) => {
    const res = await apiClient.post(`/inspections/${inspectionId}/start/`);
    return res.data;
  },
  updateChecklist: async (inspectionId: string, data: any) => {
    const res = await apiClient.put(`/inspections/${inspectionId}/checklist/`, data);
    return res.data;
  },
  uploadPhotos: async (inspectionId: string, data: FormData) => {
    const res = await apiClient.post(`/inspections/${inspectionId}/photos/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  submit: async (inspectionId: string, data: any) => {
    const res = await apiClient.post(`/inspections/${inspectionId}/submit/`, data);
    return res.data;
  },
};
