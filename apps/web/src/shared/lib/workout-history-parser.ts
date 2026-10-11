import { workoutAtlas } from './workout-atlas';

export type HistoryImportEntry = { date: string; label: string; raw: string; slug?: string };
export type TrainingProfileImport = {
  goalsAndConstraints: string[];
  progressionRules: string[];
};
/** Extract source-authored profile lines without interpreting them as medical facts. */
export function parseWorkoutProfileMarkdown(markdown: string): TrainingProfileImport {
  const section = (heading: string) => {
    const after = markdown.split('## ' + heading, 2)[1];
    return after?.split('\n## ', 1)[0] ?? '';
  };
  const bullets = (body: string) => body.split('\n')
    .filter(line => /^-\s+/.test(line))
    .map(line => line.replace(/^-\s+/, '').trim()).filter(Boolean);
  return {
    goalsAndConstraints: bullets(section('Цели и исходные данные')).slice(0, 15),
    progressionRules: bullets(section('Принципы прогрессии на 1–3 месяца')).slice(0, 15),
  };
}

const aliases: Record<string, number> = {
  'жим лёжа': 1,
  'тяга нижнего блока': 9,
  'тяга гантели': 10,
  'рычажные тяги matrix': 12,
  'присед': 14,
  'бицепс на блоке': 27,
  'брусья': 5,
  'leg press': 15,
  'shoulder press matrix': 18,
  'махи': 19,
  'rear delt matrix': 21,
  'наклонный жим гантелей': 3,
  'трицепс из-за головы': 28,
  'тяга к животу': 9,
  'скамья скотта': 22,
  'трицепс прямая рукоять': 29,
  'подъёмы прямых ног': 33,
  'наклонный жим штанги': 2,
  'рычажный вертикальный жим груди': 4,
  'трицепс overhead': 28,
};
export function parseWorkoutHistoryMarkdown(markdown: string): HistoryImportEntry[] {
  if (!markdown.includes('Хронологический журнал результатов')) {
    throw new Error('В файле не найден раздел «Хронологический журнал результатов».');
  }
  const yearMatch = markdown.match(/Период:[^\n]*\b(20\d{2})\b/);
  if (!yearMatch) throw new Error('Не удалось установить год записей. Он должен быть указан в периоде журнала.');
  const year = yearMatch[1];
  const section = markdown.split('## Хронологический журнал результатов', 2)[1]!.split('\n## ', 1)[0]!;
  const results: HistoryImportEntry[] = [];
  for (const line of section.split('\n')) {
    const match = /^\|\s*(\d{2})\.(\d{2})\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*$/.exec(line.trim());
    if (!match) continue;
    const date = `${year}-${match[2]}-${match[1]}`;
    const day = new Date(date + 'T12:00:00Z');
    if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date) throw new Error('Недопустимая дата: ' + date);
    const label = match[3]!.trim();
    const raw = match[4]!.trim();
    const normalized = label.toLowerCase().replace(/ё/g, 'ё');
    const index = aliases[normalized];
    const slug = index ? workoutAtlas[index - 1]?.slug : undefined;
    results.push({ date, label, raw, ...(slug ? {slug} : {}) });
  }
  if (!results.length) throw new Error('В журнале не найдены датированные результаты.');
  if (results.length > 160) throw new Error('Слишком много записей для одного импорта.');
  return results;
}
