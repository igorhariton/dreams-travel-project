import { API_BASE_URL } from './env';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiStatusCode = 401 | 403 | 500;

type PrimitiveQueryValue = string | number | boolean;

export interface ApiRequestOptions {
  method?: ApiMethod;
  body?: unknown;
  query?: Record<string, PrimitiveQueryValue | null | undefined>;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
  credentials?: RequestCredentials;
}

interface ApiErrorOptions {
  status?: number;
  code?: string;
  details?: unknown;
  url: string;
  method: ApiMethod;
  isNetworkError?: boolean;
  isTimeout?: boolean;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly url: string;
  readonly method: ApiMethod;
  readonly isNetworkError: boolean;
  readonly isTimeout: boolean;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.url = options.url;
    this.method = options.method;
    this.isNetworkError = Boolean(options.isNetworkError);
    this.isTimeout = Boolean(options.isTimeout);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

type ApiStatusHandler = (error: ApiError) => void;

const statusHandlers = new Map<ApiStatusCode, Set<ApiStatusHandler>>([
  [401, new Set<ApiStatusHandler>()],
  [403, new Set<ApiStatusHandler>()],
  [500, new Set<ApiStatusHandler>()],
]);

const DEFAULT_TIMEOUT_MS = 15000;

function appendQuery(url: string, query?: ApiRequestOptions['query']): string {
  if (!query) return url;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.set(key, String(value));
  });

  const serialized = params.toString();
  if (!serialized) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${serialized}`;
}

function resolveApiUrl(path: string, query?: ApiRequestOptions['query']): string {
  if (/^https?:\/\//i.test(path)) {
    return appendQuery(path, query);
  }

  const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const deduplicatedPath =
    normalizedBase.endsWith('/api') && normalizedPath.startsWith('/api/')
      ? normalizedPath.slice('/api'.length)
      : normalizedPath;

  return appendQuery(`${normalizedBase}${deduplicatedPath}`, query);
}

function isJsonLike(value: string, contentType: string | null) {
  if (contentType && contentType.toLowerCase().includes('application/json')) return true;
  const trimmed = value.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

function parseApiPayload(raw: string, contentType: string | null): unknown {
  if (!raw) return null;
  if (!isJsonLike(raw, contentType)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    const row = payload as Record<string, unknown>;
    const message =
      (typeof row.message === 'string' && row.message) ||
      (typeof row.error === 'string' && row.error) ||
      (typeof row.title === 'string' && row.title) ||
      (typeof row.detail === 'string' && row.detail);

    if (message) return message;
  }

  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status >= 500) return 'Server error. Please try again later.';
  return `Request failed with status ${status}.`;
}

function extractErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const row = payload as Record<string, unknown>;
  if (typeof row.code === 'string') return row.code;
  if (typeof row.errorCode === 'string') return row.errorCode;
  return undefined;
}

function notifyStatusHandlers(error: ApiError) {
  const status = error.status as ApiStatusCode | undefined;
  if (!status) return;
  const handlers = statusHandlers.get(status);
  if (!handlers) return;

  handlers.forEach((handler) => {
    try {
      handler(error);
    } catch {
      // Keep request flow resilient even if a global handler fails.
    }
  });
}

export function onApiStatus(status: ApiStatusCode, handler: ApiStatusHandler): () => void {
  const handlers = statusHandlers.get(status);
  if (!handlers) return () => undefined;
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export async function apiRequest<TResponse = unknown>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> {
  const method = options.method || 'GET';
  const url = resolveApiUrl(path, options.query);
  const controller = new AbortController();
  const timeoutMs = Math.max(1, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let didTimeout = false;

  const onParentAbort = () => {
    controller.abort(options.signal?.reason);
  };

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort(options.signal.reason);
    } else {
      options.signal.addEventListener('abort', onParentAbort, { once: true });
    }
  }

  const timeoutId = globalThis.setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  try {
    const bodyIsFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (!bodyIsFormData && options.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      method,
      headers,
      credentials: options.credentials ?? 'include',
      signal: controller.signal,
      body:
        options.body === undefined
          ? undefined
          : bodyIsFormData
            ? (options.body as BodyInit)
            : JSON.stringify(options.body),
    });

    const rawText = await response.text();
    const payload = parseApiPayload(rawText, response.headers.get('content-type'));

    if (!response.ok) {
      const error = new ApiError(extractErrorMessage(payload, response.status), {
        status: response.status,
        code: extractErrorCode(payload),
        details: payload,
        url,
        method,
      });
      notifyStatusHandlers(error);
      throw error;
    }

    return payload as TResponse;
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      const timeoutError = new ApiError(
        didTimeout ? 'The request timed out. Please try again.' : 'The request was canceled.',
        {
          url,
          method,
          isTimeout: didTimeout,
          isNetworkError: !didTimeout,
        },
      );
      throw timeoutError;
    }

    throw new ApiError('Network error. Please check your internet connection.', {
      url,
      method,
      isNetworkError: true,
      details: error,
    });
  } finally {
    globalThis.clearTimeout(timeoutId);
    if (options.signal) {
      options.signal.removeEventListener('abort', onParentAbort);
    }
  }
}

export function apiGet<TResponse = unknown>(path: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}) {
  return apiRequest<TResponse>(path, { ...options, method: 'GET' });
}

export function apiPost<TResponse = unknown>(
  path: string,
  body?: unknown,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {},
) {
  return apiRequest<TResponse>(path, { ...options, method: 'POST', body });
}
