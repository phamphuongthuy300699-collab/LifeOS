'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import type { Task } from '../hooks/use-tasks';

interface TaskCardProps {
  task: Task;
  onComplete?: (id: string) => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const isDone = task.status === 'done';

  return (
    <div className={`flex items-center gap-3 rounded-card border border-border bg-surface-elevated p-4 transition-all ${isDone ? 'opacity-60' : 'hover:border-border-strong'}`}>
      <button 
        onClick={() => onComplete?.(task.id)}
        disabled={isDone}
        className="text-content-muted hover:text-accent transition-colors"
      >
        {isDone ? <CheckCircle2 className="text-accent" size={24} /> : <Circle size={24} />}
      </button>
      <div className="flex-1 overflow-hidden">
        <h4 className={`truncate text-sm font-medium ${isDone ? 'line-through text-content-muted' : 'text-content'}`}>
          {task.title}
        </h4>
        {(task.dueAt || task.priority !== 'none') && (
          <div className="mt-1 flex items-center gap-2 text-xs text-content-muted">
            {task.dueAt && <span>{new Date(task.dueAt).toLocaleDateString()}</span>}
            {task.priority !== 'none' && (
              <span className="capitalize text-accent">{task.priority}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
