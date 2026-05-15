import { apiClient } from './client';

export const reviewsApi = {
  getQueue: async () => {
    const res = await apiClient.get('/reviews/my-queue/');
    return res.data;
  },
  getWorkspace: async (applicationId: string) => {
    const res = await apiClient.get(`/reviews/workspace/${applicationId}/`);
    return res.data;
  },
  getComments: async (applicationId: string) => {
    const res = await apiClient.get(`/applications/${applicationId}/comments/`);
    return res.data;
  },
  addComment: async (applicationId: string, data: any) => {
    const res = await apiClient.post(`/applications/${applicationId}/comments/`, data);
    return res.data;
  },
  resolveComment: async (applicationId: string, commentId: string, data: any) => {
    const res = await apiClient.put(`/applications/${applicationId}/comments/${commentId}/resolve/`, data);
    return res.data;
  },
  validateDocument: async (
    applicationId: string,
    documentId: string,
    data: { validation_status: 'ACCEPTED' | 'REJECTED'; validation_notes?: string }
  ) => {
    // Try the standalone document validation endpoint first
    // If that fails with 404, fall back to the application-scoped endpoint
    try {
      const res = await apiClient.put(`/documents/${documentId}/validate/`, data);
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Fallback: application-scoped path
        const res = await apiClient.put(`/applications/${applicationId}/documents/${documentId}/validate/`, data);
        return res.data;
      }
      throw err;
    }
  },
  submitDecision: async (applicationId: string, data: any) => {
    const res = await apiClient.post(`/applications/${applicationId}/review-decision/`, data);
    return res.data;
  },
  assignReviewer: async (applicationId: string, data?: any) => {
    const res = await apiClient.post(`/applications/${applicationId}/assign-reviewer/`, data || {});
    return res.data;
  },
};
