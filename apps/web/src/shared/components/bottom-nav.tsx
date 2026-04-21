'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck,
  Inbox,
  Dumbbell,
  UtensilsCrossed,
  MoreHorizontal,
} from 'lucide-react';
import { getDictionary, type LocaleCode } from '@lifeos/i18n';

const navItems = [
  { key: 'today' as const, href: '/today', icon: CalendarCheck },
  { key: 'inbox' as const, href: '/inbox', icon: Inbox },
  { key: 'workout' as const, href: '/workout', icon: Dumbbell },
  { key: 'nutrition' as const, href: '/nutrition', icon: UtensilsCrossed },
  { key: 'more' as const, href: '/more', icon: MoreHorizontal },
] as const;

/**
 * Bottom navigation bar — 5 tabs per ТЗ section 8.
 * Today, Inbox, Workout, Nutrition, More
 */
export function BottomNav() {
  const pathname = usePathname();
  // TODO: get locale from user preferences store
  const locale: LocaleCode = 'ru';
  const dict = getDictionary(locale);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 
                 border-t border-border bg-[var(--nav-bg)]
                 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map(({ key, href, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={key}
              href={href}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-2
                text-xs font-medium transition-colors
                ${
                  isActive
                    ? 'text-[var(--nav-active)]'
                    : 'text-[var(--nav-inactive)] hover:text-content-secondary'
                }
              `}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className="transition-all"
              />
              <span>{dict.nav[key]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
