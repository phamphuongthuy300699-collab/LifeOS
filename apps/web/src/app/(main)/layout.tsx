import { BottomNav } from '@/shared/components/bottom-nav';
import { QuickAddFab } from '@/shared/components/quick-add-fab';
import { QuickAddSheet } from '@/shared/components/quick-add-sheet';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';

/**
 * Main authenticated layout — wraps all (main)/* routes.
 * Contains Top AppBar, bottom navigation, and quick add FAB.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body-md text-on-background pb-24">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-outline-variant bg-surface/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-primary-container">
             {/* Initials placeholder for MVP since we don't have user photo yet */}
            <span className="font-semibold text-on-primary-container">OK</span>
          </div>
          <div>
            <h1 className="font-headline-md text-[18px] font-semibold leading-tight text-on-surface">Доброе утро</h1>
            <p className="text-xs font-medium text-on-surface-variant">Четверг, 24 октября</p>
          </div>
        </div>
        <Link
          href="/calendar"
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container"
        >
          <CalendarDays size={20} />
        </Link>
      </header>

      {/* Main content grid area wrapper */}
      <div className="mx-auto w-full max-w-[1440px]">
        {children}
      </div>

      {/* Bottom navigation — fixed */}
      <BottomNav />

      {/* Global Quick Add Components */}
      <QuickAddFab />
      <QuickAddSheet />
    </div>
  );
}
