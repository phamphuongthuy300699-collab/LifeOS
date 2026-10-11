'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, Flame, Inbox, MoveUpRight, Sparkles, Target } from 'lucide-react';
import { TaskCard } from '@/shared/components/task-card';
import { useTodayData, useCompleteTask } from '@/shared/hooks/use-tasks';
import { useLearningTracks } from '@/shared/hooks/use-learning';
import { useProjects } from '@/shared/hooks/use-projects';
import { useWorkoutPlans } from '@/shared/hooks/use-workouts';
import { useDailyNutrition } from '@/shared/hooks/use-nutrition';
import { MailWidget } from './components/mail-widget';

function time(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function day(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function TodayPage() {
  const { data, isLoading, isError, refetch } = useTodayData();
  const completeTask = useCompleteTask();
  const { data: learning } = useLearningTracks();
  const { data: projects } = useProjects();
  const { data: plans } = useWorkoutPlans();
  const { data: nutrition } = useDailyNutrition();

  if (isLoading && !data) {
    return <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="editorial-panel animate-pulse bg-lime p-8">
        <p className="editorial-kicker text-ink">LIFE/OS — DAILY EDITION</p>
        <h1 className="editorial-heading mt-6 text-4xl text-ink">Собираем твой день...</h1>
      </div>
    </main>;
  }

  if (isError) {
    return <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="editorial-panel bg-[#FF6863] p-8 text-[#111111]">
        <p className="editorial-kicker">NO SIGNAL / 503</p>
        <h1 className="editorial-heading mt-5 text-3xl sm:text-5xl">Нет связи с твоим днём.</h1>
        <p className="mt-4 max-w-xl text-sm font-semibold">Не удалось получить задачи и события. Проверь подключение к API или авторизацию.</p>
        <button type="button" onClick={() => void refetch()} className="editorial-outline-button mt-6 bg-paper text-ink">Повторить <ArrowUpRight size={16}/></button>
      </div>
    </main>;
  }

  const tasks = data?.topTasks ?? [];
  const events = data?.events ?? [];
  const due = data?.dueTodayTasks ?? [];
  const overdue = data?.overdueTasks ?? [];
  const scheduled = data?.scheduledTasks ?? [];
  const mails = data?.emailsRequiringAction ?? [];
  const plan = plans?.items?.[0];
  const consumed = Math.round(nutrition?.totals.calories ?? 0);
  const evening = projects?.items?.[0]
    ? { title: 'Проектный фокус', description: projects.items[0].currentNextAction || 'Продолжи работу над главным проектом.', href: '/projects' }
    : learning?.items?.[0]
      ? { title: 'Время учиться', description: learning.items[0].goal || 'Продвинь учебный трек на один шаг.', href: '/learning' }
      : { title: 'Новый импульс', description: 'Добавь проект или трек обучения, чтобы видеть следующие шаги.', href: '/more' };

  return (
    <main className="editorial-enter mx-auto max-w-[1460px] space-y-7 px-5 py-7 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="editorial-kicker flex items-center gap-2 text-on-surface-variant"><span className="inline-block h-3 w-3 rounded-full bg-[#4763FF]"/> 01 / ЛИЧНАЯ СИСТЕМА</p>
        <p className="editorial-kicker text-on-surface-variant">CAPTURE → PLAN → DO</p>
      </div>

      <section className="editorial-panel editorial-panel-invert relative isolate overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1.65fr)_minmax(290px,.85fr)]">
          <div className="relative z-10 flex min-h-[350px] flex-col justify-between gap-9 p-7 sm:p-11 xl:p-14">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#D7FF3F] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#D7FF3F]">Daily edition</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Выпуск 001</span>
            </div>
            <div>
              <h1 className="editorial-heading text-[clamp(2.4rem,5.8vw,6.3rem)] leading-[1.06] text-[#F5F5F0]">ТВОЙ ДЕНЬ.<span className="block text-[#D7FF3F]">ТВОЙ ХОД.</span></h1>
              <p className="mt-6 max-w-xl text-sm font-semibold leading-7 text-[#D9D9D2] sm:text-base">Собери главное, убери лишний шум и двигайся в своём темпе. Всё важное — здесь.</p>
            </div>
            <Link href="/inbox" className="editorial-outline-button w-fit border-[#D7FF3F] bg-[#D7FF3F] text-[#111111] hover:bg-[#F5F5F0]">
              Разобрать входящие <ArrowUpRight size={19}/>
            </Link>
          </div>
          <div className="editorial-stripe relative flex min-h-[260px] flex-col justify-between overflow-hidden border-t-2 border-[#111111] bg-[#D7FF3F] p-8 text-[#111111] lg:border-l-2 lg:border-t-0">
            <div className="flex items-start justify-between">
              <span className="editorial-kicker">TODAY / FOCUS</span><MoveUpRight size={28} strokeWidth={2.3}/>
            </div>
            <div className="relative">
              <span className="editorial-heading block text-[clamp(6rem,12vw,11rem)] leading-none">{String(tasks.length).padStart(2, '0')}</span>
              <span className="editorial-kicker mt-3 block">приоритетных задач</span>
            </div>
            <p className="max-w-[260px] border-t-2 border-[#111111] pt-4 text-sm font-extrabold">{data?.focusBlock || 'Планируй. Делай. Повторяй.'}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Сводка дня">
        {[
          { label: 'Задачи на сегодня', value: due.length, icon: Check, href: '/calendar', tone: 'bg-surface-bright' },
          { label: 'Входящие', value: data?.pendingInboxCount ?? 0, icon: Inbox, href: '/inbox', tone: 'bg-[#4763FF] text-white' },
          { label: 'События', value: events.length, icon: CalendarDays, href: '/calendar', tone: 'bg-surface-bright' },
          { label: 'Письма к действию', value: mails.length, icon: ArrowUpRight, href: '/mail', tone: 'bg-[#FF6863] text-[#111111]' },
        ].map(({ label, value, icon: Icon, href, tone }) => (
          <Link href={href} key={label} className={`editorial-panel group relative flex min-h-[145px] flex-col justify-between gap-5 p-5 transition-transform hover:-translate-y-1 ${tone}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[.13em]">{label}</span><Icon size={19}/>
            </div>
            <span className="editorial-heading text-[clamp(2.3rem,4vw,3.8rem)] leading-none">{String(value).padStart(2, '0')}</span>
          </Link>
        ))}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(290px,1fr)]">
        <section className="editorial-panel min-w-0 bg-surface-bright p-5 sm:p-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="editorial-kicker text-[#4763FF]">02 / EXECUTE</p>
              <h2 className="editorial-heading mt-2 text-[clamp(1.7rem,3vw,2.7rem)]">Главное сейчас.</h2>
            </div>
            <Link href="/calendar" className="editorial-outline-button bg-paper text-ink">Весь план <ArrowUpRight size={16}/></Link>
          </div>
          {completeTask.isError && <p role="alert" className="mb-4 rounded-lg bg-[#FF6863] p-3 text-sm font-semibold text-ink">Не удалось завершить задачу. Попробуй снова.</p>}
          {tasks.length ? (
            <ul className="space-y-4">{tasks.map(task => (
              <li key={task.id}><TaskCard task={task} onComplete={id => completeTask.mutate(id)}/></li>
            ))}</ul>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-outline-variant p-8 text-center">
              <Target className="mx-auto mb-3" size={30}/>
              <p className="font-extrabold">Чистый лист — тоже начало.</p>
              <p className="mt-2 text-sm text-on-surface-variant">Добавь задачу или разбери входящие, чтобы составить план дня.</p>
              <Link href="/inbox" className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold underline">Перейти во входящие <ArrowRight size={15}/></Link>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="editorial-panel bg-[#4763FF] p-6 text-white sm:p-8">
            <p className="editorial-kicker text-white/75">03 / KEEP MOVING</p>
            <div className="mt-7 flex items-center gap-3"><Sparkles size={30}/><h2 className="editorial-heading text-2xl sm:text-3xl">Продолжай движение.</h2></div>
            <p className="mt-4 text-sm font-semibold leading-6 text-white/90">{evening.title}: {evening.description}</p>
            <Link href={evening.href} className="editorial-outline-button mt-8 border-white bg-white text-ink">Следующий шаг <ArrowUpRight size={17}/></Link>
          </section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Link href="/workout" className="editorial-panel flex items-center justify-between gap-3 bg-surface-bright p-6 transition-transform hover:-translate-y-1">
              <div><p className="editorial-kicker text-[#4763FF]">MOVE / SPORT</p><h3 className="editorial-heading mt-2 text-lg">Тренировки</h3><p className="mt-1 text-xs text-on-surface-variant">{plan?.name || 'Выбери план на сегодня'}</p></div>
              <ArrowUpRight className="shrink-0" size={25}/>
            </Link>
            <Link href="/nutrition" className="editorial-panel flex items-center justify-between gap-3 bg-[#D7FF3F] p-6 text-[#111111] transition-transform hover:-translate-y-1">
              <div><p className="editorial-kicker">ENERGY / FOOD</p><h3 className="editorial-heading mt-2 text-lg">{consumed} ккал</h3><p className="mt-1 text-xs font-semibold">Учёт питания сегодня</p></div>
              <Flame className="shrink-0" size={25}/>
            </Link>
          </div>
        </aside>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="editorial-panel bg-surface-bright p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div><p className="editorial-kicker text-[#4763FF]">04 / CALENDAR</p><h2 className="editorial-heading mt-2 text-xl sm:text-2xl">На горизонте.</h2></div>
            <Link href="/calendar" className="rounded-full border-2 border-outline p-2 hover:bg-lime" aria-label="Открыть календарь"><ArrowUpRight size={20}/></Link>
          </div>
          {events.length ? <div className="space-y-3">{events.map(event => (
            <div key={event.id} className="flex items-start gap-4 border-t-2 border-outline-variant py-3">
              <span className="shrink-0 rounded-md bg-[#111111] px-3 py-2 font-extrabold text-[#D7FF3F]">{time(event.startAt)}</span>
              <div className="min-w-0"><p className="font-extrabold">{event.title || 'Событие'}</p><p className="mt-1 text-xs text-on-surface-variant">{event.location || day(event.startAt)}</p></div>
            </div>
          ))}</div> : <p className="text-sm text-on-surface-variant">На сегодня событий нет. Хороший момент спланировать что-то важное.</p>}
        </div>
        <div className="editorial-panel bg-surface-bright p-6 sm:p-8">
          <div className="mb-6"><p className="editorial-kicker text-[#FF6863]">05 / TIME BLOCKS</p><h2 className="editorial-heading mt-2 text-xl sm:text-2xl">Ритм дня.</h2></div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3"><span className="flex items-center gap-2 font-bold"><Clock3 size={17}/> Запланировано</span><span className="editorial-heading text-2xl">{scheduled.length}</span></div>
            <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3"><span className="flex items-center gap-2 font-bold"><Target size={17}/> Просрочено</span><span className="editorial-heading text-2xl">{overdue.length}</span></div>
            {(scheduled.length ? scheduled : overdue).slice(0, 3).map(task => (
              <Link href={`/tasks/${task.id}`} key={task.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low px-4 py-3 text-sm font-bold hover:bg-lime">
                <span className="truncate">{task.title}</span><ArrowUpRight size={16}/>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-panel bg-surface-bright p-5 sm:p-8">
        <div className="mb-4 flex items-center justify-between"><div><p className="editorial-kicker text-[#4763FF]">06 / INCOMING</p><h2 className="editorial-heading mt-2 text-xl sm:text-2xl">Почта и действия.</h2></div><Inbox size={24}/></div>
        <MailWidget />
      </section>
      <p className="pb-4 text-center text-[10px] font-extrabold uppercase tracking-[.22em] text-on-surface-variant">LIFE/OS — LESS NOISE. MORE LIFE. © 2026</p>
    </main>
  );
}
