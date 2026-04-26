'use client';

import { getDictionary } from '@/shared/lib/i18n';
import Link from 'next/link';
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
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { SHOW_AUTH_DEBUG } from '@/shared/lib/api';

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

  const isAuthenticated = status === 'authenticated' && Boolean(user);

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
