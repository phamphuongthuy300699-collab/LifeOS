'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, clearAuthStorage, setAuthStorage } from '@/shared/lib/api';
import { emitAuthChanged } from '@/providers/auth-provider';

type CallbackState = 'processing' | 'done' | 'error';

function parseHash(hash: string) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);
  return {
    accessToken: params.get('accessToken'),
    refreshToken: params.get('refreshToken'),
    userId: params.get('userId'),
    workspaceId: params.get('workspaceId'),
  };
}

export default function GoogleAuthCallbackPage() {
  const [state, setState] = useState<CallbackState>('processing');

  const message = useMemo(() => {
    if (state === 'processing') return 'Завершаем вход в Google...';
    if (state === 'done') return 'Вход выполнен. Перенаправляем...';
    return 'Не удалось завершить вход. Попробуйте снова.';
  }, [state]);

  useEffect(() => {
    const finishGoogleAuth = async () => {
      let storedToken = false;
      try {
        const { accessToken, refreshToken, userId, workspaceId } = parseHash(
          window.location.hash,
        );

        if (!accessToken || !userId) {
          const queryParams = new URLSearchParams(window.location.search);
          const code = queryParams.get('code');
          if (code) {
            window.location.replace(
              `/api/v1/auth/google/callback${window.location.search}`,
            );
            return;
          }
        }

        if (!accessToken || !userId) {
          setState('error');
          return;
        }

        setAuthStorage({
          accessToken,
          refreshToken,
          userId,
          workspaceId,
        });
        storedToken = true;

        try {
          const authMe = await apiFetch<{
            user: { id: string };
            workspaceId: string | null;
          }>('/auth/me');

          setAuthStorage({
            userId: authMe.user.id,
            workspaceId: authMe.workspaceId,
          });
        } catch (authMeError) {
          console.error('[google-callback] /auth/me failed, continue with stored token', authMeError);
        }

        emitAuthChanged();
        setState('done');
        window.history.replaceState({}, document.title, '/auth/google/callback');
        window.location.replace('/today');
      } catch {
        if (!storedToken) {
          clearAuthStorage();
        }
        setState('error');
      }
    };
    void finishGoogleAuth();
  }, []);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-6">
      <div className="w-full rounded-2xl border border-border bg-surface p-6 text-center">
        <h1 className="text-lg font-semibold text-content">Google OAuth</h1>
        <p className="mt-3 text-sm text-content-muted">{message}</p>
      </div>
    </div>
  );
}
