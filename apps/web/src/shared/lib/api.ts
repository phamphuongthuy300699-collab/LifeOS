const configuredApiBase =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined;
const demoModeFlag =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEMO_MODE : undefined;
const devHeaderAuthFlag =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ENABLE_DEV_HEADER_AUTH : undefined;

const normalizedConfiguredApiBase = (configuredApiBase?.trim() || '/api/v1').replace(/\/$/, '');

/**
 * In browser we always use same-origin /api/v1 and rely on Next.js rewrites.
 * This avoids cross-origin fetch instability during OAuth and auth refresh.
 */
export const API_BASE =
  typeof window === 'undefined' ? normalizedConfiguredApiBase : '/api/v1';
export const IS_DEMO_MODE = demoModeFlag === 'true';
const API_FETCH_TIMEOUT_MS = 8000;
const ACCESS_TOKEN_KEY = 'lifeos-access-token';
const REFRESH_TOKEN_KEY = 'lifeos-refresh-token';
const USER_ID_KEY = 'lifeos-user-id';
const WORKSPACE_ID_KEY = 'lifeos-workspace-id';

export type AuthStorage = {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  workspaceId: string | null;
};

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public endpoint?: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function describeApiError(
  error: unknown,
  endpoint?: string,
): { userMessage: string; debugMessage: string } {
  if (error instanceof ApiError) {
    const endpointInfo = error.endpoint ?? endpoint ?? 'unknown-endpoint';
    const details =
      error.details !== undefined ? JSON.stringify(error.details) : 'no-body';
    return {
      userMessage: error.message || 'Request failed',
      debugMessage: `[api:${endpointInfo}] status=${error.status} code=${error.code} body=${details}`,
    };
  }

  if (error instanceof Error) {
    const endpointInfo = endpoint ?? 'unknown-endpoint';
    return {
      userMessage: error.message || 'Request failed',
      debugMessage: `[api:${endpointInfo}] non-api-error=${error.message}`,
    };
  }

  const endpointInfo = endpoint ?? 'unknown-endpoint';
  return {
    userMessage: 'Request failed',
    debugMessage: `[api:${endpointInfo}] unknown-error=${String(error)}`,
  };
}

export interface ApiResponse<T> {
  data: T;
}

export function getAuthStorage(): AuthStorage {
  if (typeof window === 'undefined') {
    return {
      accessToken: null,
      refreshToken: null,
      userId: null,
      workspaceId: null,
    };
  }
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    userId: localStorage.getItem(USER_ID_KEY),
    workspaceId: localStorage.getItem(WORKSPACE_ID_KEY),
  };
}

export function setAuthStorage(payload: Partial<AuthStorage>): void {
  if (typeof window === 'undefined') return;
  if (payload.accessToken !== undefined) {
    if (payload.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
  if (payload.refreshToken !== undefined) {
    if (payload.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  if (payload.userId !== undefined) {
    if (payload.userId) localStorage.setItem(USER_ID_KEY, payload.userId);
    else localStorage.removeItem(USER_ID_KEY);
  }
  if (payload.workspaceId !== undefined) {
    if (payload.workspaceId) localStorage.setItem(WORKSPACE_ID_KEY, payload.workspaceId);
    else localStorage.removeItem(WORKSPACE_ID_KEY);
  }
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(WORKSPACE_ID_KEY);
}

export function shouldUseDemoFallback(): boolean {
  return IS_DEMO_MODE;
}

function buildDefaultHeaders(): Headers {
  const headers = new Headers();

  if (typeof window !== 'undefined') {
    const { userId, accessToken } = getAuthStorage();

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    if (devHeaderAuthFlag === 'true' && userId) {
      headers.set('x-user-id', userId);
    }
  }

  return headers;
}

/**
 * Generic fetch wrapper for calls to /api/v1
 */
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${normalizedEndpoint}`;
  
  const headers = buildDefaultHeaders();
  const requestHeaders = new Headers(options?.headers);
  requestHeaders.forEach((value, key) => headers.set(key, value));

  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const timeoutController = new AbortController();
  const externalSignal = options?.signal;

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => timeoutController.abort(), {
      once: true,
    });
  }

  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, API_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: timeoutController.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'Request timeout', 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = 'An error occurred';
    let errorDetails: unknown;
    try {
      const errorData = await response.json();
      errorDetails = errorData;
      errorCode = errorData.code || errorData.errorCode || errorCode;
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Fallback if not JSON
    }
    throw new ApiError(
      errorCode,
      errorMessage,
      response.status,
      normalizedEndpoint,
      errorDetails,
    );
  }

  // Returns empty object for 204 No Content
  if (response.status === 204) return {} as T;

  return response.json();
}

export const api = {
  async get<T>(endpoint: string, options?: Omit<RequestInit, 'method'>): Promise<ApiResponse<T>> {
    const data = await apiFetch<T>(endpoint, { ...options, method: 'GET' });
    return { data };
  },
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestInit, 'method' | 'body'>,
  ): Promise<ApiResponse<T>> {
    const data = await apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { data };
  },
  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestInit, 'method' | 'body'>,
  ): Promise<ApiResponse<T>> {
    const data = await apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { data };
  },
};
