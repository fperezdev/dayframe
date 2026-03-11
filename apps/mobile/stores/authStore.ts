import { create } from 'zustand';
import { User } from '@dayframe/shared';
import { authApi, saveTokens, clearTokens, getStoredAccessToken } from '../services/api';
import { getSetting, setSetting } from '../db/sync';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      await saveTokens(response.tokens);
      await setSetting('user_id', response.user.id);
      await setSetting('user_email', response.user.email);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Please check your credentials.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register({ email, password });
      await saveTokens(response.tokens);
      await setSetting('user_id', response.user.id);
      await setSetting('user_email', response.user.email);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await authApi.logout();
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await getStoredAccessToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      const userId = await getSetting('user_id');
      const userEmail = await getSetting('user_email');
      if (userId && userEmail) {
        set({
          user: { id: userId, email: userEmail, createdAt: '' },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch {
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
