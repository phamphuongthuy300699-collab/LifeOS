'use client';

import { Plus } from 'lucide-react';
import { useUiStore } from '../stores/ui.store';

export function QuickAddFab() {
  const openQuickAdd = useUiStore((state) => state.openQuickAdd);
  return (
    <button type="button" onClick={openQuickAdd}
      className="fixed bottom-[106px] right-5 z-40 flex h-16 w-16 items-center justify-center rounded-[20px] border-2 border-ink bg-lime text-ink shadow-[5px_5px_0_#111111] transition-transform hover:-translate-y-1 active:translate-y-0 xl:bottom-8 xl:right-8"
      aria-label="Быстро добавить запись">
      <Plus size={30} strokeWidth={2.7}/>
    </button>
  );
}
