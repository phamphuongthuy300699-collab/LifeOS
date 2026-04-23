'use client';

import { useState } from 'react';
import { useTriageInboxItem } from '../hooks/use-inbox';
import type { InboxItem } from '../hooks/use-inbox';
import { MessageSquarePlus } from 'lucide-react';

export function InboxItemCard({ item }: { item: InboxItem }) {
  const triageMutation = useTriageInboxItem(item.id);
  const [showTriage, setShowTriage] = useState(false);

  const handleTriage = (targetType: 'task' | 'note') => {
    triageMutation.mutate({
      targetType,
      title: item.title || item.rawText.substring(0, 50),
      body: item.rawText,
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-elevated p-4 transition-all hover:border-border-strong">
      <div className="flex items-start justify-between">
        <p className="text-sm text-content whitespace-pre-wrap flex-1">{item.rawText}</p>
      </div>
      
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <span className="text-xs text-content-muted capitalize">{item.sourceType} • {new Date(item.capturedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        
        {!showTriage ? (
          <button 
            onClick={() => setShowTriage(true)}
            className="text-xs font-medium text-accent hover:underline"
          >
            Обработать
          </button>
        ) : (
          <div className="flex gap-2 animate-fade-in">
            <button 
              onClick={() => handleTriage('task')}
              disabled={triageMutation.isPending}
              className="flex items-center gap-1 rounded bg-accent/10 px-2 py-1 text-xs text-accent hover:bg-accent/20"
            >
              <CheckSquareIcon size={14} /> Задача
            </button>
            <button 
              onClick={() => handleTriage('note')}
              disabled={triageMutation.isPending}
              className="flex items-center gap-1 rounded bg-surface px-2 py-1 text-xs text-content-secondary hover:bg-border/50 border border-border"
            >
              <MessageSquarePlus size={14} /> Заметка
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline fallback icon for task since I missed importing CheckSquare
function CheckSquareIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"></polyline>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
  );
}
