import { workoutAtlas } from './workout-atlas';

export type AtlasPlanTemplate = {
  slug: string;
  name: string;
  goal: string;
  exercises: { slug: string; sets: number; reps: string; rest: number }[];
};
const item = (number: number, sets: number, reps: string, rest = 90) => ({
  slug: workoutAtlas[number - 1]!.slug, sets, reps, rest,
});

/**
 * Cycle derived from the uploaded "Новый трёхдневный цикл" and discussed
 * exercise combinations. These are editable STARTING templates, not a
 * medical prescription, historic performance or automatic load advice.
 * Dips are intentionally not in the default rotation.
 */
export const atlasCycle: AtlasPlanTemplate[] = [
  {
    slug: 'atlas-day-1',
    name: 'ДЕНЬ 01 / PUSH + DELTS',
    goal: 'Грудь · трицепс · средняя дельта · кор',
    exercises: [
      item(3, 3, '6–10', 120),
      item(4, 2, '8–12', 120),
      item(28, 3, '10–15'),
      item(19, 3, '12–20', 60),
      item(38, 3, '10–15', 60),
    ],
  },
  {
    slug: 'atlas-day-2',
    name: 'ДЕНЬ 02 / PULL + BICEPS',
    goal: 'Спина · бицепс · кор · задняя дельта',
    exercises: [
      item(6, 3, '6–12', 120),
      item(9, 3, '8–12', 120),
      item(13, 2, '12–15', 75),
      item(22, 3, '8–12', 90),
      item(21, 3, '12–15', 60),
      item(36, 3, '10–15', 60),
    ],
  },
  {
    slug: 'atlas-day-3',
    name: 'ДЕНЬ 03 / SHOULDERS + ARMS',
    goal: 'Плечи · руки · поддержка ног · кор',
    exercises: [
      item(18, 3, '8–12', 120),
      item(20, 3, '12–20', 60),
      item(23, 3, '8–12', 90),
      item(29, 3, '10–15', 75),
      item(15, 3, '8–12', 120),
      item(16, 2, '10–15', 75),
      item(34, 2, '10–15', 60),
    ],
  },
];

export const progressionRules = [
  'Сначала увеличивать чистые повторения; затем добавлять рабочий вес.',
  'Основные рабочие подходы — с запасом около 1–2 повторений.',
  'Не сравнивать числа на разных моделях тренажёров как идентичную нагрузку.',
  'При боли в плече или кисти остановить болезненное движение; при сохраняющихся симптомах обратиться к специалисту.',
] as const;

export function getAtlasInstallPayload() {
  return {
    exercises: workoutAtlas.map(e => ({
      slug: e.slug, name: e.name, nameEn: e.nameEn, group: e.group,
    })),
    plans: atlasCycle,
  };
}
