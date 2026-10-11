import { BottomNav } from '@/shared/components/bottom-nav';
import { QuickAddFab } from '@/shared/components/quick-add-fab';
import { QuickAddSheet } from '@/shared/components/quick-add-sheet';
import { BrandHeader } from '@/shared/components/brand-header';

/** Shared shell for all authenticated LifeOS routes. */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-background pb-28 xl:pb-10">
      <BrandHeader />
      <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      <BottomNav />
      <QuickAddFab />
      <QuickAddSheet />
    </div>
  );
}
