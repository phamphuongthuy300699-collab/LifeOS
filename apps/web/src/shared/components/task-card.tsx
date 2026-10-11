'use client';

import { Check, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { Task } from '../hooks/use-tasks';

interface TaskCardProps {
  task: Task;
  onComplete?: (id: string) => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const done = task.status === 'done';
  return (
    <article className={`group flex items-center gap-4 rounded-[14px] border-2 border-outline bg-surface-bright px-4 py-4 shadow-[4px_4px_0_rgba(17,17,17,.16)] transition-transform hover:-translate-y-0.5 ${done ? 'opacity-60' : ''}`}>
      <button type="button" onClick={() => onComplete?.(task.id)} disabled={done || !onComplete}
        aria-label={done ? 'Задача выполнена' : `Выполнить: ${task.title}`}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-outline transition-colors ${done ? 'bg-lime text-ink' : 'bg-transparent hover:bg-lime hover:text-ink'}`}>
        {done ? <Check size={21} strokeWidth={3}/> : <span className="h-2 w-2 rounded-full bg-current"/>}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[14px] font-extrabold text-on-surface ${done ? 'line-through' : ''}`}>{task.title}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          {task.dueAt && <span>{new Date(task.dueAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</span>}
          {task.priority && task.priority !== 'none' && <span className="text-[#4763FF]">{task.priority}</span>}
        </div>
      </div>
      <Link href={`/tasks/${task.id}`} aria-label={`Открыть задачу ${task.title}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-outline text-on-surface hover:bg-electric hover:text-white">
        <ArrowUpRight size={18}/>
      </Link>
    </article>
  );
}
