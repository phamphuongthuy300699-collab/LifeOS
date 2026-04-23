'use client';

import { useState, useRef, useEffect } from 'react';
import { useUiStore } from '../stores/ui.store';
import { useCreateInboxItem } from '../hooks/use-inbox';
import { Send, X } from 'lucide-react';

export function QuickAddSheet() {
  const { isQuickAddOpen, closeQuickAdd } = useUiStore();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const createInboxMutation = useCreateInboxItem();

  useEffect(() => {
    if (isQuickAddOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isQuickAddOpen]);

  if (!isQuickAddOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    createInboxMutation.mutate(
      { rawText: text, captureChannel: 'quick_add' },
      {
        onSuccess: () => {
          setText('');
          closeQuickAdd();
        }
      }
    );
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={closeQuickAdd}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-sheet bg-surface-elevated p-4 shadow-xl animate-slide-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-content">Быстрый захват</h2>
          <button onClick={closeQuickAdd} className="text-content-muted hover:text-content">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Что нужно записать?"
            className="h-12 w-full resize-none rounded-lg border border-border bg-surface px-3 py-3 text-[16px] text-content placeholder:text-content-muted focus:border-accent focus:outline-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || createInboxMutation.isPending}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </>
  );
}
