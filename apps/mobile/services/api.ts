import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  AuthResponse,
  LoginInput,
  RegisterInput,
  AuthTokens,
  SyncPayload,
  SyncResponse,
} from '@dayframe/shared';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const STORE_ACCESS_TOKEN = 'dayframe_access_token';
const STORE_REFRESH_TOKEN = 'dayframe_refresh_token';

// ─── Storage helpers (SecureStore on native, localStorage on web) ─────────────

async function storeGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function storeSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storeDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await storeGet(STORE_ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config) & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const newTokens = await authApi.refreshTokens();
        await saveTokens(newTokens);
        original.headers!.Authorization = `Bearer ${newTokens.accessToken}`;
        return api(original);
      } catch (e) {
        console.error('[api] Token refresh failed, clearing tokens:', e);
        await clearTokens();
        // Caller should redirect to login
      }
    }
    return Promise.reject(error);
  },
);

// ─── Token helpers ────────────────────────────────────────────────────────────

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    storeSet(STORE_ACCESS_TOKEN, tokens.accessToken),
    storeSet(STORE_REFRESH_TOKEN, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    storeDelete(STORE_ACCESS_TOKEN),
    storeDelete(STORE_REFRESH_TOKEN),
  ]);
}

export async function getStoredAccessToken(): Promise<string | null> {
  return storeGet(STORE_ACCESS_TOKEN);
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', input);
    return res.data;
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', input);
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {}
    await clearTokens();
  },

  async refreshTokens(): Promise<AuthTokens> {
    const refreshToken = await storeGet(STORE_REFRESH_TOKEN);
    const res = await api.post<AuthTokens>('/auth/refresh', { refreshToken });
    return res.data;
  },

  async registerPushToken(pushToken: string): Promise<void> {
    await api.post('/auth/push-token', { pushToken });
  },
};

// ─── Sync API ─────────────────────────────────────────────────────────────────

export const syncApi = {
  async sync(payload: SyncPayload): Promise<SyncResponse> {
    const res = await api.post<SyncResponse>('/sync', payload);
    return res.data;
  },
};

export default api;
