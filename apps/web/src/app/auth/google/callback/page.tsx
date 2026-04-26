'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [state, setState] = useState<CallbackState>('processing');

  const message = useMemo(() => {
    if (state === 'processing') return 'Завершаем вход в Google...';
    if (state === 'done') return 'Вход выполнен. Перенаправляем...';
    return 'Не удалось завершить вход. Попробуйте снова.';
  }, [state]);

  useEffect(() => {
    const finishGoogleAuth = async () => {
      try {
        const { accessToken, refreshToken, userId, workspaceId } = parseHash(
          window.location.hash,
        );

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

        const authMe = await apiFetch<{
          user: { id: string };
          workspaceId: string | null;
        }>('/auth/me');

        setAuthStorage({
          userId: authMe.user.id,
          workspaceId: authMe.workspaceId,
        });

        setState('done');
        emitAuthChanged();
        window.history.replaceState({}, document.title, '/auth/google/callback');
        router.replace('/today');
      } catch {
        clearAuthStorage();
        setState('error');
      }
    };
    void finishGoogleAuth();
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-6">
      <div className="w-full rounded-2xl border border-border bg-surface p-6 text-center">
        <h1 className="text-lg font-semibold text-content">Google OAuth</h1>
        <p className="mt-3 text-sm text-content-muted">{message}</p>
      </div>
    </div>
  );
}
