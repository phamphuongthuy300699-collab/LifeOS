'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Inbox, Dumbbell, Utensils, MoreHorizontal } from 'lucide-react';

const items = [
  { href: '/today', icon: CalendarDays, label: 'Сегодня' },
  { href: '/inbox', icon: Inbox, label: 'Входящие' },
  { href: '/workout', icon: Dumbbell, label: 'Спорт' },
  { href: '/nutrition', icon: Utensils, label: 'Питание' },
  { href: '/more', icon: MoreHorizontal, label: 'Ещё' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-lime bg-[#111111] px-2 pt-2 text-[#F5F5F0] shadow-[0_-6px_35px_rgba(17,17,17,.18)] xl:hidden"
      aria-label="Нижняя навигация">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around gap-1 pb-[max(12px,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
            className={`group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors ${active ? 'bg-[#D7FF3F] text-[#111111]' : 'text-[#F5F5F0] hover:bg-[#343434]'}`}>
            <Icon size={21} strokeWidth={active ? 2.6 : 1.9} aria-hidden="true" />
            <span className="truncate text-[9px] font-extrabold uppercase tracking-[.04em]">{item.label}</span>
          </Link>;
        })}
      </div>
    </nav>
  );
}
