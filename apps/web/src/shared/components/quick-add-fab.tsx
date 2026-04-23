'use client';

import { Plus } from 'lucide-react';
import { useUiStore } from '../stores/ui.store';

export function QuickAddFab() {
  const openQuickAdd = useUiStore((state) => state.openQuickAdd);

  return (
    <button
      onClick={openQuickAdd}
      className="fixed bottom-[100px] right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label="Быстрый захват"
    >
      <Plus size={28} />
    </button>
  );
}
