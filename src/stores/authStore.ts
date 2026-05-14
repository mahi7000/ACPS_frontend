import { create } from 'zustand';
import type { User } from '@/types';
import { apiClient } from '@/services/api/client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  initialize: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    
    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
        });
      } catch (e) {
        // Handle invalid JSON
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
  },

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login/', { email, password });
    const { access, refresh, role, user_id } = response.data;
    
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    
    // We will need to fetch the full user profile or mock it from login response
    // For now we set partial info
    const partialUser = { id: user_id, role, email } as User;
    localStorage.setItem('user', JSON.stringify(partialUser));
    
    set({
      accessToken: access,
      refreshToken: refresh,
      user: partialUser,
      isAuthenticated: true,
    });
  },

  logout: () => {
    // Optionally call logout endpoint
    // apiClient.post('/auth/logout/', { refresh: get().refreshToken });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  refresh: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return;
    try {
      const response = await apiClient.post('/auth/refresh/', { refresh: refreshToken });
      const { access } = response.data;
      localStorage.setItem('accessToken', access);
      set({ accessToken: access });
    } catch (e) {
      get().logout();
    }
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
