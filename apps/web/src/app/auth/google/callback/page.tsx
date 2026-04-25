'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    try {
      const { accessToken, refreshToken, userId, workspaceId } = parseHash(
        window.location.hash,
      );

      if (!accessToken || !userId) {
        setState('error');
        return;
      }

      localStorage.setItem('lifeos-access-token', accessToken);
      localStorage.setItem('lifeos-user-id', userId);
      if (refreshToken) {
        localStorage.setItem('lifeos-refresh-token', refreshToken);
      }
      if (workspaceId) {
        localStorage.setItem('lifeos-workspace-id', workspaceId);
      }

      setState('done');
      window.history.replaceState({}, document.title, '/auth/google/callback');
      router.replace('/today');
    } catch {
      setState('error');
    }
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
