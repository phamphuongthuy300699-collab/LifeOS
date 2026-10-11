'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, ChartNoAxesColumn, ChevronRight, Dumbbell, FileUp, HeartPulse, Search, ShieldAlert, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch, describeApiError } from '@/shared/lib/api';
import { workoutAtlas, type AtlasExercise } from '@/shared/lib/workout-atlas';
import { atlasCycle, getAtlasInstallPayload, progressionRules } from '@/shared/lib/workout-cycle';
import { parseWorkoutHistoryMarkdown, type HistoryImportEntry } from '@/shared/lib/workout-history-parser';
import { useWorkoutPlans, useStartWorkoutSession } from '@/shared/hooks/use-workouts';

type Tab = 'cycle' | 'atlas' | 'journal' | 'progress';
type HistorySession = {
  id: string;
  date: string;
  status: string;
  imported: boolean;
  exercises: {
    id: string;
    name: string;
    slug: string | null;
    label: string | null;
    raw: string | null;
    sets: { weight: number | null; reps: number | null; rir: number | null; rpe: number | null; isWarmup: boolean }[];
  }[];
};
type HistoryResponse = { items: HistorySession[] };
const groups = ['Все', 'грудь', 'спина', 'ноги', 'плечи', 'бицепс', 'трицепс', 'кор'] as const;

function AtlasPictures({ exercise, compact = false }: { exercise: AtlasExercise; compact?: boolean }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${compact ? '' : 'sm:gap-5'}`}>
      {exercise.images.map((image, index) => (
        <figure key={image} className="overflow-hidden rounded-[16px] border-2 border-[#111111] bg-[#F5F5F0]">
          <img src={image} alt={`${exercise.name}: ${index === 0 ? 'исходное положение' : 'конечное положение'} — условная схема`}
            loading="lazy" className="w-full" width={320} height={240}/>
          <figcaption className="border-t-2 border-[#111111] bg-[#D7FF3F] px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-[#111111]">
            {index === 0 ? '01 / СТАРТ' : '02 / ФИНИШ'}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function WorkoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {data: plansResponse, isLoading: plansLoading, isError: plansError} = useWorkoutPlans();
  const startWorkout = useStartWorkoutSession();
  const [tab, setTab] = useState<Tab>('cycle');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedAtlas, setSelectedAtlas] = useState(workoutAtlas[18]!.slug);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>('Все');
  const [preview, setPreview] = useState<HistoryImportEntry[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [actionError, setActionError] = useState('');
  const [importResult, setImportResult] = useState('');

  const plans = plansResponse?.items ?? [];
  const selectedPlan = plans.find(plan => plan.id === selectedPlanId) ?? plans[0] ?? null;
  useEffect(() => {
    if (!selectedPlanId && plans[0]) setSelectedPlanId(plans[0].id);
  }, [plans, selectedPlanId]);

  const historyQuery = useQuery({
    queryKey: ['workout-atlas-history'],
    queryFn: () => apiFetch<HistoryResponse>('/workout-atlas/history'),
    retry: false,
  });

  const install = useMutation({
    mutationFn: () => apiFetch<{exercisesEnsured: number; plansCreated: number}>('/workout-atlas/install', {
      method: 'POST', body: JSON.stringify(getAtlasInstallPayload()), timeoutMs: 60000,
    }),
    onSuccess: async () => { await queryClient.invalidateQueries({queryKey:['workout-plans']}); setActionError(''); },
    onError: err => setActionError(describeApiError(err).userMessage),
  });

  const importHistory = useMutation({
    mutationFn: (entries: HistoryImportEntry[]) => apiFetch<{datesCreated:number;entriesCreated:number;datesSkipped:number}>('/workout-atlas/history/import', {
      method:'POST',body:JSON.stringify({entries}),timeoutMs:60000,
    }),
    onSuccess: async result => {
      setImportResult(`Импортировано записей: ${result.entriesCreated}; новых дат: ${result.datesCreated}; повторных дат пропущено: ${result.datesSkipped}.`);
      setPreview([]);
      await queryClient.invalidateQueries({queryKey:['workout-atlas-history']});
    },
    onError: err => setFileError(describeApiError(err).userMessage),
  });

  const openHistoryFile = async (file?: File) => {
    setPreview([]); setFileError(''); setImportResult('');
    if(!file)return;
    if(file.size > 1024*1024) {setFileError('Файл больше 1 МБ. Выбери исходный Markdown-журнал.');return;}
    try {
      const entries = parseWorkoutHistoryMarkdown(await file.text());
      setPreview(entries); setFileName(file.name);
    } catch (err) { setFileError(err instanceof Error ? err.message : 'Не удалось прочитать журнал'); }
  };

  const start = async () => {
    if(!selectedPlan || startWorkout.isPending) return;
    setActionError('');
    try { const session = await startWorkout.mutateAsync({workoutPlanId:selectedPlan.id}); router.push(`/workout/session/${session.id}`); }
    catch(err) {setActionError(describeApiError(err).userMessage);}
  };

  const catalog = useMemo(() => workoutAtlas.filter(exercise => (
    (group === 'Все' || exercise.group === group) &&
    (`${exercise.name} ${exercise.nameEn}`.toLowerCase().includes(query.trim().toLowerCase()))
  )), [group,query]);
  const detail = workoutAtlas.find(e=>e.slug===selectedAtlas) ?? workoutAtlas[0]!;
  const sessions = historyQuery.data?.items ?? [];
  const imported = sessions.filter(s=>s.imported);
  const live = sessions.filter(s=>!s.imported && s.status==='completed');
  const completedSets = live.reduce((sum,s)=>sum+s.exercises.reduce((count,e)=>count+e.sets.filter(set=>!set.isWarmup).length,0),0);
  const latestResults = useMemo(()=>{
    const bySlug = new Map<string,{name:string; weight:number; reps:number; date:string; totalSets:number}>();
    for(const s of live)for(const e of s.exercises)for(const set of e.sets){
      if(!e.slug || set.isWarmup || set.weight===null || !set.reps)continue;
      const prior = bySlug.get(e.slug);
      if(!prior || set.weight > prior.weight || (set.weight===prior.weight && set.reps>prior.reps)) {
        bySlug.set(e.slug,{name:e.name,weight:set.weight,reps:set.reps,date:s.date,totalSets:0});
      }
    }
    return Array.from(bySlug.values()).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);
  },[live]);

  return (
    <main className="editorial-enter mx-auto max-w-[1450px] space-y-7 px-5 py-7 sm:px-8 sm:py-10">
      <header className="editorial-panel relative overflow-hidden bg-[#111111] p-7 text-[#F5F5F0] sm:p-10">
        <div className="absolute -right-10 -top-12 h-52 w-52 rotate-12 rounded-[55px] bg-[#D7FF3F] opacity-95 sm:h-64 sm:w-64" aria-hidden="true"/>
        <div className="relative z-10 max-w-3xl">
          <p className="editorial-kicker text-[#D7FF3F]">LIFE / MOVE — ТВОЙ ТРЕНИРОВОЧНЫЙ АТЛАС</p>
          <h1 className="editorial-heading mt-4 text-[clamp(2.4rem,6vw,5.6rem)]">СИЛА В ДЕТАЛЯХ<span className="text-[#D7FF3F]">.</span></h1>
          <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-white/80">Планируй цикл. Смотри схемы упражнений. Записывай каждый подход и возвращайся к своей истории без потери деталей.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-[#111111]">
            <span className="rounded-full bg-[#D7FF3F] px-4 py-2 text-[11px] font-extrabold uppercase">38 упражнений</span>
            <span className="rounded-full bg-[#F5F5F0] px-4 py-2 text-[11px] font-extrabold uppercase">76 иллюстраций</span>
            <span className="rounded-full bg-[#FF6863] px-4 py-2 text-[11px] font-extrabold uppercase">3 дня цикла</span>
          </div>
        </div>
      </header>

      <nav aria-label="Разделы тренировок" className="flex flex-wrap gap-2">
        {([
          ['cycle','Мой цикл',Dumbbell],
          ['atlas','Атлас',BookOpen],
          ['journal','Журнал',CalendarDays],
          ['progress','Прогресс',ChartNoAxesColumn],
        ] as const).map(([key,label,Icon])=>(
          <button type="button" key={key} onClick={()=>setTab(key)} aria-current={tab===key?'page':undefined}
            className={`inline-flex items-center gap-2 rounded-full border-2 border-outline px-4 py-3 text-xs font-extrabold uppercase tracking-wide transition-transform hover:-translate-y-0.5 ${tab===key?'bg-[#D7FF3F] text-[#111111] shadow-[3px_3px_0_#111111]':'bg-surface-bright text-on-surface'}`}>
            <Icon size={17}/>{label}
          </button>
        ))}
      </nav>

      {tab==='cycle' && (
        <div className="space-y-6">
          <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="editorial-panel bg-surface-bright p-6 sm:p-8">
              <p className="editorial-kicker text-[#4763FF]">01 / TRAINING SPLIT</p>
              <h2 className="editorial-heading mt-2 text-3xl">Три дня. Один вектор.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-on-surface-variant">Приоритет — плечи, руки и кор. Ноги поддерживаем, грудь и спину сохраняем. Цикл можно проходить 2–3 раза в неделю, продолжая его последовательно.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {atlasCycle.map((plan,index)=>(
                  <article key={plan.slug} className={`rounded-[16px] border-2 border-outline p-5 ${index===0?'bg-[#D7FF3F] text-[#111111]':index===1?'bg-[#4763FF] text-white':'bg-surface-container-low text-on-surface'}`}>
                    <p className="editorial-kicker">DAY / 0{index+1}</p>
                    <h3 className="editorial-heading mt-5 text-lg">{plan.name.replace(' / ','\n')}</h3>
                    <p className="mt-3 text-xs font-bold leading-5">{plan.goal}</p>
                    <p className="mt-5 text-xs font-extrabold uppercase">{plan.exercises.length} упражнений <ArrowRight className="inline h-4 w-4"/></p>
                  </article>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {atlasCycle.map((plan,index)=>(
                  <details key={plan.slug} className="group rounded-[14px] border-2 border-outline bg-surface p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-extrabold">
                      <span>День 0{index+1}: {plan.goal}</span><ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90"/>
                    </summary>
                    <ol className="mt-4 space-y-3 border-t border-outline-variant pt-4">
                      {plan.exercises.map((exercise,i)=>(
                        <li key={exercise.slug} className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-3"><span className="text-xs font-extrabold text-[#4763FF]">{String(i+1).padStart(2,'0')}</span>
                            <span>{workoutAtlas.find(x=>x.slug===exercise.slug)?.name}</span></span>
                          <span className="shrink-0 text-xs font-extrabold">{exercise.sets}×{exercise.reps}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                ))}
              </div>
            </div>
            <aside className="space-y-5">
              <div className="editorial-panel bg-[#D7FF3F] p-6 text-[#111111]">
                <p className="editorial-kicker">ТВОЯ БАЗА</p><h2 className="editorial-heading mt-4 text-2xl">Начать цикл</h2>
                <p className="mt-3 text-sm font-semibold leading-6">Установим 38 упражнений и три плана в твою личную базу. Повторное нажатие не создаст дубликаты.</p>
                <Button disabled={install.isPending} onClick={()=>install.mutate()} className="mt-5 w-full bg-[#111111] text-[#F5F5F0] hover:bg-[#4763FF] hover:text-white">
                  {install.isPending?'Устанавливаю...':'Установить программы'}<ArrowUpRight size={16}/>
                </Button>
                {install.isSuccess && <p role="status" className="mt-3 text-xs font-bold">Упражнения сохранены. Новых планов: {install.data.plansCreated}.</p>}
              </div>
              <div className="editorial-panel bg-surface-bright p-6">
                <p className="editorial-kicker text-[#4763FF]">WORKOUT MODE</p>
                <h3 className="editorial-heading mt-3 text-xl">Мои планы</h3>
                {plansLoading && <p className="mt-3 text-sm">Загрузка планов...</p>}
                {plansError && <p className="mt-3 text-sm text-[#BF3434]">Не удалось получить планы.</p>}
                {!plansLoading && !plans.length && <p className="mt-3 text-sm text-on-surface-variant">Пока нет планов. Установи цикл выше.</p>}
                <div className="mt-4 space-y-2">
                  {plans.map(plan=>(
                    <button type="button" key={plan.id} onClick={()=>setSelectedPlanId(plan.id)}
                      className={`w-full rounded-xl border-2 border-outline px-4 py-3 text-left text-sm font-bold ${selectedPlan?.id===plan.id?'bg-[#D7FF3F] text-[#111111]':'bg-surface-container-low'}`}>
                      {plan.name}<span className="mt-1 block text-xs font-medium">{plan.exercises.length} упражнений</span>
                    </button>
                  ))}
                </div>
                {selectedPlan && <Button disabled={startWorkout.isPending} onClick={()=>void start()} className="mt-5 w-full">
                  {startWorkout.isPending?'Запускаю...':'Начать тренировку'}<ArrowRight size={16}/>
                </Button>}
              </div>
            </aside>
          </section>
          <section className="editorial-panel bg-surface-bright p-6 sm:p-8">
            <p className="editorial-kicker text-[#4763FF]">PROGRESSION / 1—3 MONTHS</p>
            <h2 className="editorial-heading mt-2 text-2xl">Прогресс без догадок.</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {progressionRules.map((rule,i)=><div key={rule} className="flex gap-3 border-t-2 border-outline-variant pt-3 text-sm font-semibold"><span className="font-extrabold text-[#4763FF]">0{i+1}</span>{rule}</div>)}
            </div>
          </section>
        </div>
      )}

      {tab==='atlas' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,.85fr)_minmax(0,1.25fr)]">
          <section className="editorial-panel bg-surface-bright p-5 sm:p-7">
            <p className="editorial-kicker text-[#4763FF]">02 / EXERCISE LIBRARY</p>
            <h2 className="editorial-heading mt-2 text-2xl">38 движений.</h2>
            <label className="mt-6 flex items-center gap-3 rounded-xl border-2 border-outline px-3"><Search size={19}/>
              <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск: махи, бицепс..." aria-label="Поиск упражнений" className="w-full border-0 bg-transparent py-3 text-sm outline-none"/>
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {groups.map(g=><button type="button" key={g} onClick={()=>setGroup(g)}
                className={`rounded-full border-2 border-outline px-3 py-1.5 text-[11px] font-extrabold uppercase ${group===g?'bg-[#D7FF3F] text-[#111111]':'bg-surface-container-low text-on-surface'}`}>{g}</button>)}
            </div>
            <div className="mt-5 max-h-[640px] space-y-2 overflow-y-auto pr-1">
              {catalog.map(e=>(
                <button type="button" key={e.slug} onClick={()=>setSelectedAtlas(e.slug)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-left transition-colors ${detail.slug===e.slug?'border-[#111111] bg-[#D7FF3F] text-[#111111]':'border-outline-variant bg-surface-container-low text-on-surface hover:border-outline'}`}>
                  <span className="min-w-0"><span className="block truncate text-sm font-extrabold">{e.name}</span><span className="block text-[11px] font-medium opacity-70">{e.nameEn}</span></span>
                  <span className="shrink-0 text-[10px] font-extrabold">{String(e.id).padStart(2,'0')}</span>
                </button>
              ))}
              {!catalog.length && <p className="p-5 text-sm text-on-surface-variant">Нет упражнений по такому запросу.</p>}
            </div>
          </section>
          <section className="editorial-panel h-fit bg-surface-bright p-5 sm:p-8">
            <p className="editorial-kicker text-[#4763FF]">ATLAS / {String(detail.id).padStart(2,'0')} — {detail.group.toUpperCase()}</p>
            <h2 className="editorial-heading mt-3 text-[clamp(1.4rem,3vw,2.4rem)]">{detail.name}</h2>
            <p className="mb-6 mt-2 text-sm text-on-surface-variant">{detail.nameEn}</p>
            <AtlasPictures exercise={detail}/>
            <p className="mt-5 flex gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-xs leading-6 text-on-surface-variant"><ShieldAlert size={19} className="shrink-0"/>Схемы из загруженного атласа условные и показывают лишь фазы и целевую мышечную группу. Это не индивидуальная инструкция по технике.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#4763FF] px-3 py-2 text-[11px] font-extrabold uppercase text-white">{detail.group}</span>
              <button type="button" onClick={()=>setTab('cycle')} className="editorial-outline-button text-ink">К программам <ArrowUpRight size={16}/></button>
            </div>
          </section>
        </div>
      )}

      {tab==='journal' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_360px]">
          <section className="editorial-panel bg-surface-bright p-6 sm:p-8">
            <p className="editorial-kicker text-[#4763FF]">03 / TRAINING LOG</p>
            <h2 className="editorial-heading mt-2 text-3xl">История движений.</h2>
            <p className="mt-3 text-sm text-on-surface-variant">Импортированные записи сохраняются дословно: диапазоны, помощь партнёра, паузы и комментарии не превращаются в вымышленные точные подходы.</p>
            {historyQuery.isLoading && <p className="mt-6 text-sm">Загрузка журнала...</p>}
            {historyQuery.isError && <p className="mt-6 text-sm text-[#BF3434]">История не загружена. Войди в аккаунт и проверь подключение к API.</p>}
            <div className="mt-6 space-y-5">
              {sessions.map(session=>(
                <article key={session.id} className="rounded-[16px] border-2 border-outline p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="editorial-heading text-lg">{new Date(session.date+'T12:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}</h3>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${session.imported?'bg-[#4763FF] text-white':'bg-[#D7FF3F] text-[#111111]'}`}>{session.imported?'Архив':'Записано в LifeOS'}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {session.exercises.map(exercise=>(
                      <div key={exercise.id} className="border-t border-outline-variant pt-3">
                        <p className="text-sm font-extrabold">{exercise.label || exercise.name}</p>
                        {exercise.raw ? <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">{exercise.raw}</p>
                          : <p className="mt-1 text-xs text-on-surface-variant">{exercise.sets.map(set=>`${set.weight ?? '—'} кг × ${set.reps ?? '—'}`).join(' · ')||'Подходы не отмечены'}</p>}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
              {!historyQuery.isLoading && !sessions.length && <div className="rounded-xl border-2 border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">Пока нет сохранённых тренировок. Импортируй исходный журнал или проведи первую тренировку.</div>}
            </div>
          </section>
          <aside className="editorial-panel h-fit bg-[#D7FF3F] p-6 text-[#111111]">
            <FileUp size={34}/>
            <p className="editorial-kicker mt-5">PRIVATE IMPORT / MD</p>
            <h2 className="editorial-heading mt-3 text-2xl">Перенеси свой архив.</h2>
            <p className="mt-3 text-sm font-semibold leading-6">Загрузи оригинальный <code>training_history.md</code>. Данные отправятся в твой аккаунт LifeOS, а не в публичный GitHub.</p>
            <label className="mt-5 block cursor-pointer rounded-xl border-2 border-dashed border-[#111111] bg-[#F5F5F0] p-5 text-center text-xs font-extrabold uppercase">
              {fileName || 'Выбрать .md файл'}
              <input type="file" accept=".md,text/markdown,text/plain" className="sr-only" onChange={e=>void openHistoryFile(e.target.files?.[0])}/>
            </label>
            {preview.length>0 && <div className="mt-4 rounded-xl bg-[#F5F5F0] p-4 text-sm font-bold">
              <p>{preview.length} записей · {new Set(preview.map(e=>e.date)).size} дат</p>
              <p className="mt-2 text-xs font-semibold">Предпросмотр: {preview[0]?.label} — {preview[0]?.raw}</p>
              <Button disabled={importHistory.isPending} onClick={()=>importHistory.mutate(preview)} className="mt-4 w-full">
                {importHistory.isPending?'Импортирую...':'Подтвердить импорт'} <ArrowUpRight size={16}/>
              </Button>
            </div>}
            {fileError && <p role="alert" className="mt-3 rounded-lg bg-[#FF6863] p-3 text-xs font-bold">{fileError}</p>}
            {importResult && <p role="status" className="mt-3 rounded-lg bg-[#F5F5F0] p-3 text-xs font-bold">{importResult}</p>}
            <p className="mt-4 text-[11px] font-semibold leading-5">Дубликаты дат из этого же архива не создаются. Для личных данных требуется авторизация.</p>
          </aside>
        </div>
      )}

      {tab==='progress' && (
        <div className="space-y-6">
          <section className="editorial-panel bg-surface-bright p-6 sm:p-8">
            <p className="editorial-kicker text-[#4763FF]">04 / REAL PROGRESS</p>
            <h2 className="editorial-heading mt-2 text-3xl">Только зафиксированное.</h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {[
                {label:'Тренировки LifeOS',value:live.length,color:'bg-[#D7FF3F] text-[#111111]'},
                {label:'Точные рабочие подходы',value:completedSets,color:'bg-[#4763FF] text-white'},
                {label:'Архивные даты',value:imported.length,color:'bg-[#FF6863] text-[#111111]'},
              ].map(metric=>(
                <div key={metric.label} className={`rounded-[16px] border-2 border-outline p-5 ${metric.color}`}>
                  <p className="editorial-kicker">{metric.label}</p><p className="editorial-heading mt-5 text-5xl">{metric.value}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="editorial-panel bg-surface-bright p-6 sm:p-8">
            <h2 className="editorial-heading text-2xl">Лучшие точные подходы</h2>
            <p className="mt-2 text-sm text-on-surface-variant">Только завершённые подходы внутри LifeOS, отдельно по упражнению. Архивные приблизительные данные в рекорды не включаются.</p>
            <div className="mt-6 space-y-2">
              {latestResults.map(result=>(
                <div key={result.name} className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-outline-variant py-3">
                  <span className="text-sm font-extrabold">{result.name}</span>
                  <span className="text-sm font-extrabold">{result.weight} кг × {result.reps} <span className="ml-2 text-xs text-on-surface-variant">{result.date}</span></span>
                </div>
              ))}
              {!latestResults.length && <p className="text-sm text-on-surface-variant">Здесь появятся результаты после первых завершённых подходов с записанным весом и повторами.</p>}
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-surface-container-low p-4 text-xs leading-6 text-on-surface-variant"><HeartPulse size={20} className="shrink-0"/>Числа разных тренажёров и загруженные исторические приблизительные значения не следует сравнивать напрямую.</div>
          </section>
        </div>
      )}

      {actionError && <p role="alert" className="editorial-panel bg-[#FF6863] p-4 text-sm font-bold text-[#111111]">{actionError}</p>}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-outline-variant py-5 text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
        <span>TRAIN SMART / TRACK TRUE / STAY CONSISTENT</span><Link href="/today" className="inline-flex items-center gap-2 hover:underline"><ArrowLeft size={15}/> На главную</Link>
      </footer>
    </main>
  );
}
