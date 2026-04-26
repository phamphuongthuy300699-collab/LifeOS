'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getDictionary } from '@/shared/lib/i18n';
import { CalendarDays, Inbox, Dumbbell, Utensils, MoreHorizontal } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const dict = getDictionary('ru');

  const navItems = [
    { href: '/today', icon: CalendarDays, label: dict.nav.today },
    { href: '/mail', icon: Inbox, label: dict.nav.inbox },
    { href: '/workout', icon: Dumbbell, label: dict.nav.workout },
    { href: '/nutrition', icon: Utensils, label: dict.nav.nutrition },
    { href: '/more', icon: MoreHorizontal, label: dict.nav.more },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 border-t border-outline-variant bg-surface/80 backdrop-blur-xl">
      <div className="flex justify-around items-center pt-3 pb-8 px-4 w-full">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center group ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              <Icon 
                size={24} 
                className={`mb-1 transition-transform ${isActive ? 'scale-110' : 'group-hover:text-primary/70'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="font-['Inter'] text-[10px] font-medium uppercase tracking-widest">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
