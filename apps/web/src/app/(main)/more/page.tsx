'use client';

import { getDictionary } from '@/shared/lib/i18n';
import Link from 'next/link';
import { useState } from 'react';
import {
  BookOpen,
  Users,
  FolderKanban,
  Wallet,
  Download,
  Settings,
  LogIn,
  LogOut,
  RefreshCw,
  TestTube2,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { API_BASE, ApiError, SHOW_AUTH_DEBUG, getAuthStorage } from '@/shared/lib/api';

const menuItems = [
  { key: 'learning' as const, href: '/learning', icon: BookOpen },
  { key: 'contacts' as const, href: '/contacts', icon: Users },
  { key: 'projects' as const, href: '/projects', icon: FolderKanban },
  { key: 'finance' as const, href: '/finance', icon: Wallet },
  { key: 'export' as const, href: '/export', icon: Download },
  { key: 'settings' as const, href: '/settings', icon: Settings },
] as const;

export default function MorePage() {
  const dict = getDictionary('ru');
  const {
    status,
    user,
    workspaceId,
    gmailConnected,
    apiBaseUrl,
    isDemoMode,
    error,
    refreshAuth,
    logout,
  } = useAuth();
  const [debugRunState, setDebugRunState] = useState<
    null | 'health-write' | 'nutrition-patch' | 'workout-start'
  >(null);
  const [debugResult, setDebugResult] = useState<{
    endpoint: string;
    status: number | 'network_error';
    elapsedMs: number;
    requestId: string | null;
    body: unknown;
  } | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  const isAuthenticated = status === 'authenticated' && Boolean(user);

  const runDebugRequest = async (
    endpoint: string,
    init: RequestInit,
  ): Promise<{
    endpoint: string;
    status: number;
    elapsedMs: number;
    requestId: string | null;
    body: unknown;
  }> => {
    const startedAt = performance.now();
    const { accessToken } = getAuthStorage();
    const headers = new Headers(init.headers);
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...init,
      headers,
    });
    const elapsedMs = Math.round(performance.now() - startedAt);
    const text = await response.text();
    let parsedBody: unknown = text;
    if (text) {
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = text;
      }
    } else {
      parsedBody = null;
    }

    const requestIdFromBody =
      parsedBody && typeof parsedBody === 'object' && 'requestId' in parsedBody
        ? String((parsedBody as { requestId?: string }).requestId ?? '')
        : null;
    const requestId = response.headers.get('x-request-id') || requestIdFromBody || null;

    if (!response.ok) {
      const message =
        parsedBody && typeof parsedBody === 'object'
          ? String(
              (parsedBody as { message?: string; error?: string }).message ||
                (parsedBody as { message?: string; error?: string }).error ||
                `HTTP ${response.status}`,
            )
          : `HTTP ${response.status}`;
      throw new ApiError(
        'DEBUG_REQUEST_FAILED',
        message,
        response.status,
        endpoint,
        {
          requestId,
          body: parsedBody,
          elapsedMs,
        },
      );
    }

    return {
      endpoint,
      status: response.status,
      elapsedMs,
      requestId,
      body: parsedBody,
    };
  };

  const handleDebugHealthWrite = async () => {
    setDebugRunState('health-write');
    setDebugError(null);
    setDebugResult(null);
    const startedAt = performance.now();
    try {
      const result = await runDebugRequest('/debug/health-write', {
        method: 'GET',
      });
      setDebugResult(result);
    } catch (error) {
      const elapsedMs = Math.round(performance.now() - startedAt);
      if (error instanceof ApiError) {
        const details =
          error.details && typeof error.details === 'object'
            ? (error.details as Record<string, unknown>)
            : {};
        setDebugResult({
          endpoint: '/debug/health-write',
          status: error.status,
          elapsedMs:
            typeof details.elapsedMs === 'number' ? Number(details.elapsedMs) : elapsedMs,
          requestId:
            typeof details.requestId === 'string' ? details.requestId : null,
          body: details.body ?? null,
        });
        setDebugError(error.message);
      } else {
        setDebugResult({
          endpoint: '/debug/health-write',
          status: 'network_error',
          elapsedMs,
          requestId: null,
          body: null,
        });
        setDebugError(error instanceof Error ? error.message : 'Network error');
      }
    } finally {
      setDebugRunState(null);
    }
  };

  const handleDebugNutritionPatch = async () => {
    setDebugRunState('nutrition-patch');
    setDebugError(null);
    setDebugResult(null);
    const endpoint = '/nutrition-goals/current';
    const startedAt = performance.now();
    try {
      const result = await runDebugRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({
          caloriesTarget: 2650,
          proteinTargetG: 155,
          fatTargetG: 70,
          carbsTargetG: 350,
        }),
      });
      setDebugResult(result);
    } catch (error) {
      const elapsedMs = Math.round(performance.now() - startedAt);
      if (error instanceof ApiError) {
        const details =
          error.details && typeof error.details === 'object'
            ? (error.details as Record<string, unknown>)
            : {};
        setDebugResult({
          endpoint,
          status: error.status,
          elapsedMs:
            typeof details.elapsedMs === 'number' ? Number(details.elapsedMs) : elapsedMs,
          requestId:
            typeof details.requestId === 'string' ? details.requestId : null,
          body: details.body ?? null,
        });
        setDebugError(error.message);
      } else {
        setDebugResult({
          endpoint,
          status: 'network_error',
          elapsedMs,
          requestId: null,
          body: null,
        });
        setDebugError(error instanceof Error ? error.message : 'Network error');
      }
    } finally {
      setDebugRunState(null);
    }
  };

  const handleDebugWorkoutStart = async () => {
    setDebugRunState('workout-start');
    setDebugError(null);
    setDebugResult(null);
    const endpoint = '/workout-sessions';
    const startedAt = performance.now();
    try {
      const plansResult = await runDebugRequest('/workout-plans', {
        method: 'GET',
      });
      const plansPayload = plansResult.body as { items?: Array<{ id: string }> } | null;
      const workoutPlanId = plansPayload?.items?.[0]?.id;
      if (!workoutPlanId) {
        throw new Error(
          'Не найден workout plan для теста. Сначала создайте/импортируйте план.',
        );
      }

      const result = await runDebugRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ workoutPlanId }),
      });
      setDebugResult(result);
    } catch (error) {
      const elapsedMs = Math.round(performance.now() - startedAt);
      if (error instanceof ApiError) {
        const details =
          error.details && typeof error.details === 'object'
            ? (error.details as Record<string, unknown>)
            : {};
        setDebugResult({
          endpoint,
          status: error.status,
          elapsedMs:
            typeof details.elapsedMs === 'number' ? Number(details.elapsedMs) : elapsedMs,
          requestId:
            typeof details.requestId === 'string' ? details.requestId : null,
          body: details.body ?? null,
        });
        setDebugError(error.message);
      } else {
        setDebugResult({
          endpoint,
          status: 'network_error',
          elapsedMs,
          requestId: null,
          body: null,
        });
        setDebugError(error instanceof Error ? error.message : 'Network error');
      }
    } finally {
      setDebugRunState(null);
    }
  };

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-content">{dict.nav.more}</h1>

      <section className="mt-4 rounded-xl border border-outline-variant bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-content-muted">
          Аккаунт
        </h2>
        <div className="mt-3 space-y-1 text-sm text-content">
          <p>
            {isAuthenticated
              ? `Вы вошли как ${user?.email ?? user?.id ?? 'пользователь'}`
              : 'Вы не авторизованы'}
          </p>
          <p>Почта Gmail: {gmailConnected ? 'подключена' : 'не подключена'}</p>
          {error ? <p className="text-red-500">Ошибка: {error}</p> : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refreshAuth()}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary"
          >
            <RefreshCw size={16} />
            Обновить статус
          </button>
          {!isAuthenticated ? (
            <a
              href="/api/v1/auth/google"
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary"
            >
              <LogIn size={16} />
              {dict.auth.signInWithGoogle}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary"
            >
              <LogOut size={16} />
              {dict.auth.logout}
            </button>
          )}
        </div>
      </section>

      {SHOW_AUTH_DEBUG ? (
        <section className="mt-3 rounded-xl border border-outline-variant bg-surface p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-content-muted">
            Auth Debug
          </h2>
          <div className="mt-3 space-y-1 text-sm text-content">
            <p>Статус: {status}</p>
            <p>Email: {user?.email ?? '—'}</p>
            <p>User ID: {user?.id ?? '—'}</p>
            <p>Workspace ID: {workspaceId ?? '—'}</p>
            <p>Gmail connected: {gmailConnected ? 'yes' : 'no'}</p>
            <p>API base: {apiBaseUrl}</p>
            <p>Demo mode: {isDemoMode ? 'true' : 'false'}</p>
            {error ? <p className="text-red-500">Auth error: {error}</p> : null}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => void handleDebugHealthWrite()}
              disabled={debugRunState !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary disabled:opacity-60"
            >
              <TestTube2 size={16} />
              {debugRunState === 'health-write'
                ? 'Проверяю...'
                : 'Test Health Write'}
            </button>
            <button
              type="button"
              onClick={() => void handleDebugNutritionPatch()}
              disabled={debugRunState !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary disabled:opacity-60"
            >
              <TestTube2 size={16} />
              {debugRunState === 'nutrition-patch'
                ? 'Проверяю...'
                : 'Test Nutrition Goal Patch'}
            </button>
            <button
              type="button"
              onClick={() => void handleDebugWorkoutStart()}
              disabled={debugRunState !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary disabled:opacity-60"
            >
              <TestTube2 size={16} />
              {debugRunState === 'workout-start'
                ? 'Проверяю...'
                : 'Test Workout Session Create'}
            </button>
          </div>

          {debugResult ? (
            <div className="mt-4 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-xs text-content">
              <p>Endpoint: {debugResult.endpoint}</p>
              <p>Status: {debugResult.status}</p>
              <p>Elapsed ms: {debugResult.elapsedMs}</p>
              <p>Request ID: {debugResult.requestId ?? '—'}</p>
              <p className="mt-2 font-semibold">Response body:</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded bg-black/20 p-2">
                {JSON.stringify(debugResult.body, null, 2)}
              </pre>
            </div>
          ) : null}
          {debugError ? (
            <p className="mt-3 text-sm text-red-400">Debug error: {debugError}</p>
          ) : null}
        </section>
      ) : null}

      <div className="mt-6 space-y-1">
        {menuItems.map(({ key, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className="flex items-center gap-4 rounded-xl px-4 py-3 text-content transition-colors hover:bg-surface-secondary"
          >
            <Icon size={20} className="text-content-muted" />
            <span className="text-sm font-medium">{dict.more[key]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
