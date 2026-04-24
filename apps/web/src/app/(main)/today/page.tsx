'use client';

import { getDictionary } from '@/shared/lib/i18n';
import { useTodayData, useCompleteTask } from '@/shared/hooks/use-tasks';
import { TaskCard } from '@/shared/components/task-card';
import { Rocket, BrainCircuit, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { MailWidget } from './components/mail-widget';

export default function TodayPage() {
  const dict = getDictionary('ru');
  const { data, isLoading, isError } = useTodayData();
  const completeMutation = useCompleteTask();

  const handleComplete = (id: string) => {
    completeMutation.mutate(id);
  };

  if (isLoading && !data) {
    return <div className="p-6 text-on-surface-variant">{dict.common.loading}</div>;
  }

  if (isError) {
    return (
      <main className="px-6 py-8">
        <section className="rounded-xl border border-outline-variant bg-surface-container-low p-6">
          <h2 className="text-xl font-semibold text-on-surface">Today временно недоступен</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Не удалось загрузить данные. Проверь подключение к API или настройки авторизации.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="grid grid-cols-1 md:grid-cols-12 gap-gutter px-6 py-8">
      {/* Bento Grid Column Left */}
      <div className="md:col-span-8 flex flex-col gap-xl">
        
        {/* Focus Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface">{dict.today.focusBlock}</h2>
            <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase">Приоритеты</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container p-6 border border-outline-variant rounded-xl flex flex-col justify-between min-h-[160px] relative overflow-hidden">
              <div className="relative z-10">
                <Rocket className="text-primary mb-3" size={24} />
                <h3 className="font-body-lg text-body-lg font-semibold text-on-surface">Запуск квартального отчета</h3>
                <p className="text-sm text-on-surface-variant mt-1">{data?.focusBlock || 'Фокус дня ещё не задан'}</p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5">
                <Rocket size={120} />
              </div>
            </div>
            <div className="bg-surface-container p-6 border border-outline-variant rounded-xl flex flex-col justify-between min-h-[160px] relative overflow-hidden">
              <div className="relative z-10">
                <BrainCircuit className="text-primary mb-3" size={24} />
                <h3 className="font-body-lg text-body-lg font-semibold text-on-surface">Глубокая работа</h3>
                <p className="text-sm text-on-surface-variant mt-1">Проектирование MVP</p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5">
                <BrainCircuit size={120} />
              </div>
            </div>
          </div>
        </section>

        {/* Tasks & Events Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
          {/* Tasks Section */}
          <section className="bg-surface border border-outline-variant rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-md text-headline-md text-on-surface">Задачи</h2>
              <button className="text-primary text-sm font-semibold">Все</button>
            </div>
            <ul className="flex flex-col gap-0 border-b-0">
              {data?.topTasks && data.topTasks.length > 0 ? (
                data.topTasks.map(task => (
                  <li key={task.id} className="py-4 border-b border-outline-variant last:border-0 flex flex-col">
                     {/* Wrapping the existing TaskCard to adapt to the new list style */}
                     <TaskCard task={task} onComplete={handleComplete} />
                  </li>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-on-surface-variant">Нет задач</div>
              )}
            </ul>
          </section>

          {/* Upcoming Events (Sprint 2 placeholder) */}
          <section className="bg-surface border border-outline-variant rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-md text-headline-md text-on-surface">События</h2>
              <span className="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold px-2 py-1 rounded uppercase">Сегодня</span>
            </div>
            <div className="flex flex-col gap-4">
               {data?.events && data.events.length > 0 ? (
                  data.events.map((evt: any) => (
                    <div key={evt.id} className="flex gap-4 p-3 rounded-lg hover:bg-surface-container transition-colors">
                      <div className="text-center min-w-[48px]">
                        <p className="text-primary font-bold">14:00</p>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">мск</p>
                      </div>
                      <div className="border-l-2 border-primary pl-4">
                        <h4 className="font-semibold text-on-surface">{evt.title}</h4>
                      </div>
                    </div>
                  ))
               ) : (
                  <div className="text-center py-4 text-sm text-on-surface-variant">Нет событий</div>
               )}
            </div>
          </section>
        </div>

        {/* Emails / Inbox Summary */}
        <MailWidget />

      </div>

      {/* Sidebar Column Right */}
      <aside className="md:col-span-4 flex flex-col gap-xl">
        {/* Workout Card Stub */}
        <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="h-40 bg-surface-dim relative border-b border-outline-variant">
             <div className="absolute inset-0 flex items-center justify-center">
                <Activity size={48} className="text-outline-variant" />
             </div>
             <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Интенсив</span>
             </div>
          </div>
          <div className="p-6">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Тренировка сегодня</h3>
            <Link
              href="/workout"
              className="block w-full py-3 border border-primary text-primary text-center rounded-full font-semibold hover:bg-primary hover:text-on-primary transition-all"
            >
              Начать
            </Link>
          </div>
        </section>
        
        {/* Evening Suggestion */}
        <section className="bg-inverse-surface text-inverse-on-surface rounded-xl p-6 relative overflow-hidden mt-auto">
          <div className="relative z-10">
            <h3 className="font-headline-md text-headline-md mb-2">Вечерний досуг</h3>
            <p className="text-outline-variant text-sm mb-4">Осталось 30 минут на обучение по UI-анимациям.</p>
            <button className="flex items-center gap-2 text-inverse-primary font-semibold text-sm">
              Начать обучение <ArrowRight size={16} />
            </button>
          </div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
        </section>
      </aside>

    </main>
  );
}
