'use client';

import {
  ApiError,
  apiFetch,
  API_BASE,
  clearAuthStorage,
  getAuthStorage,
  IS_DEMO_MODE,
  setAuthStorage,
} from '@/shared/lib/api';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

type AuthMeResponse = {
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  workspaceId: string | null;
  integrations?: {
    google?: {
      connected?: boolean;
      syncEnabled?: boolean;
    };
  };
};

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  workspaceId: string | null;
  gmailConnected: boolean;
  apiBaseUrl: string;
  isDemoMode: boolean;
  error: string | null;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_CHANGED_EVENT = 'lifeos-auth-changed';

async function loadAuthMe(): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>('/auth/me');
}

export function emitAuthChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAuth = useCallback(async () => {
    const { accessToken } = getAuthStorage();
    if (!accessToken) {
      setStatus('unauthenticated');
      setUser(null);
      setWorkspaceId(null);
      setGmailConnected(false);
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);
    try {
      const me = await loadAuthMe();
      setAuthStorage({
        userId: me.user.id,
        workspaceId: me.workspaceId ?? null,
      });
      setUser({
        id: me.user.id,
        email: me.user.email,
        displayName: me.user.displayName,
      });
      setWorkspaceId(me.workspaceId ?? null);
      setGmailConnected(Boolean(me.integrations?.google?.connected));
      setStatus('authenticated');
    } catch (err) {
      const unauthorized =
        err instanceof ApiError && (err.status === 401 || err.status === 403);

      if (unauthorized) {
        clearAuthStorage();
        setUser(null);
        setWorkspaceId(null);
        setGmailConnected(false);
        setStatus('unauthenticated');
      } else {
        setStatus('error');
      }
      setError(err instanceof Error ? err.message : 'Auth check failed');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore API logout errors; local logout must still complete.
    }
    clearAuthStorage();
    setUser(null);
    setWorkspaceId(null);
    setGmailConnected(false);
    setStatus('unauthenticated');
    setError(null);
    emitAuthChanged();
  }, []);

  useEffect(() => {
    void refreshAuth();
    const listener = () => {
      void refreshAuth();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, listener);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, listener);
    };
  }, [refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      workspaceId,
      gmailConnected,
      apiBaseUrl: API_BASE,
      isDemoMode: IS_DEMO_MODE,
      error,
      refreshAuth,
      logout,
    }),
    [error, gmailConnected, logout, refreshAuth, status, user, workspaceId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
