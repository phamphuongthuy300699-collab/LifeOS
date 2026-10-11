'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';

const menu = [
  { href: '/today', text: 'Сегодня' },
  { href: '/inbox', text: 'Входящие' },
  { href: '/calendar', text: 'План' },
  { href: '/workout', text: 'Тренировки' },
  { href: '/nutrition', text: 'Питание' },
  { href: '/more', text: 'Ещё' },
];

export function BrandHeader() {
  const pathname = usePathname();
  const [dateLabel, setDateLabel] = useState('Твой день, твои правила');
  useEffect(() => {
    setDateLabel(new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long',
    }).format(new Date()));
  }, []);

  return (
    <header className="editorial-topbar sticky top-0 z-50">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-3 sm:px-8 xl:py-4">
        <Link href="/today" className="flex min-w-0 items-center gap-3" aria-label="LifeOS — главная">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border-2 border-ink bg-lime text-ink shadow-[3px_3px_0_#111111]">
            <span className="editorial-wordmark text-lg">L/</span>
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="editorial-wordmark text-[20px] leading-none text-on-surface sm:text-[24px]">LIFE<span className="text-[#4763FF]">/</span>OS</span>
            <span className="mt-1 truncate text-[10px] font-extrabold uppercase tracking-[.12em] text-on-surface-variant">{dateLabel}</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Главная навигация">
          {menu.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-[12px] font-extrabold uppercase tracking-[.03em] transition-colors ${active ? 'bg-ink text-paper' : 'text-on-surface hover:bg-lime hover:text-ink'}`}>
              {item.text}
            </Link>;
          })}
        </nav>
        <Link href="/calendar" className="editorial-outline-button shrink-0 bg-lime text-ink hover:bg-paper"
          aria-label="Открыть календарь и планирование">
          <CalendarDays size={17}/><span className="hidden sm:inline">Планировать</span><ArrowUpRight size={15} className="hidden sm:block"/>
        </Link>
      </div>
    </header>
  );
}
