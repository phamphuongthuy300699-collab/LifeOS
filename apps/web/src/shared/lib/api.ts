export const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

export interface ApiResponse<T> {
  data: T;
}

function buildDefaultHeaders(): Headers {
  const headers = new Headers();

  // Temporary compatibility with API mail middleware.
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('lifeos-user-id');
    const accessToken = localStorage.getItem('lifeos-access-token');

    if (userId) {
      headers.set('x-user-id', userId);
    }

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  return headers;
}

/**
 * Generic fetch wrapper for calls to /api/v1
 */
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = buildDefaultHeaders();
  const requestHeaders = new Headers(options?.headers);
  requestHeaders.forEach((value, key) => headers.set(key, value));

  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorCode = errorData.code || errorCode;
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Fallback if not JSON
    }
    throw new ApiError(errorCode, errorMessage, response.status);
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
