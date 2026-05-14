import { create } from 'zustand';
import type { Notification } from '@/types';
import { apiClient } from '@/services/api/client';

interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],

  fetchNotifications: async () => {
    try {
      // Mocking endpoint path based on common REST structure since it's not fully detailed in spec
      const response = await apiClient.get('/notifications/');
      set({
        notifications: response.data.results || [],
        unreadCount: response.data.unread_count || 0,
      });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiClient.post(`/notifications/${id}/read/`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.notification_id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.post('/notifications/read-all/');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  },
}));
