export type AppEnv = 'development' | 'staging' | 'production' | 'test';

type ViteEnvLike = {
  MODE?: string;
  DEV?: boolean;
  PROD?: boolean;
  VITE_API_BASE_URL?: string;
  VITE_ENABLE_CHAT_FALLBACK?: string;
  VITE_APP_ENV?: string;
};

function getViteEnv(): ViteEnvLike {
  const meta = import.meta as ImportMeta & { env?: ViteEnvLike };
  return meta.env ?? {};
}

function normalizeAppEnv(value: string | undefined, fallback: AppEnv): AppEnv {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'development' || normalized === 'staging' || normalized === 'production' || normalized === 'test') {
    return normalized;
  }
  return fallback;
}

function readBoolean(value: string | undefined, fallback = false): boolean {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return fallback;
}

function normalizeApiBaseUrl(value: string | undefined): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '/api';
  return trimmed.replace(/\/+$/, '') || '/api';
}

const env = getViteEnv();
const modeEnv = normalizeAppEnv(env.MODE, env.PROD ? 'production' : 'development');
const rawApiBaseUrl = typeof env.VITE_API_BASE_URL === 'string' ? env.VITE_API_BASE_URL.trim() : '';

export const APP_ENV: AppEnv = normalizeAppEnv(env.VITE_APP_ENV, modeEnv);
export const HAS_EXPLICIT_API_BASE_URL = rawApiBaseUrl.length > 0;
export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);
export const ENABLE_CHAT_FALLBACK = APP_ENV === 'development' && readBoolean(env.VITE_ENABLE_CHAT_FALLBACK, false);
