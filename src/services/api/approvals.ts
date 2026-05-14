import { apiClient } from './client';

export const approvalsApi = {
  getQueue: async () => {
    const res = await apiClient.get('/approvals/queue/');
    return res.data;
  },
  getDetail: async (applicationId: string) => {
    const res = await apiClient.get(`/approvals/${applicationId}/`);
    return res.data;
  },
  issueConsent: async (applicationId: string) => {
    const res = await apiClient.post(`/applications/${applicationId}/issue-consent/`);
    return res.data;
  },
  issuePermit: async (applicationId: string) => {
    const res = await apiClient.post(`/applications/${applicationId}/issue-permit/`);
    return res.data;
  },
  issueCompletionCertificate: async (applicationId: string) => {
    const res = await apiClient.post(`/applications/${applicationId}/issue-completion-certificate/`);
    return res.data;
  },
  rejectFinal: async (applicationId: string, data: any) => {
    const res = await apiClient.post(`/applications/${applicationId}/reject-final/`, data);
    return res.data;
  },
  getCompletionReview: async (applicationId: string) => {
    const res = await apiClient.get(`/approvals/completion-review/${applicationId}/`);
    return res.data;
  },
};
