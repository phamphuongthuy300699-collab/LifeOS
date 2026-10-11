/** Catalog transcribed from the user-provided 38-exercise atlas.
 * Illustrations are supplied schematic phases, NOT coaching/form advice.
 * No personal performance or health history is committed in this module.
 */
export type AtlasExercise = {
  id: number; slug: string; name: string; nameEn: string; group: string; images: [string,string];
};
export const workoutAtlas: AtlasExercise[] = [
  {
    "id": 1,
    "slug": "barbell-bench-press",
    "name": "Жим штанги лёжа",
    "nameEn": "Barbell Bench Press",
    "group": "грудь",
    "images": [
      "/workout-atlas/01_1.svg",
      "/workout-atlas/01_2.svg"
    ]
  },
  {
    "id": 2,
    "slug": "incline-barbell-bench-press",
    "name": "Жим штанги на наклонной",
    "nameEn": "Incline Barbell Bench Press",
    "group": "грудь",
    "images": [
      "/workout-atlas/02_1.svg",
      "/workout-atlas/02_2.svg"
    ]
  },
  {
    "id": 3,
    "slug": "incline-dumbbell-press",
    "name": "Жим гантелей на наклонной",
    "nameEn": "Incline Dumbbell Press",
    "group": "грудь",
    "images": [
      "/workout-atlas/03_1.svg",
      "/workout-atlas/03_2.svg"
    ]
  },
  {
    "id": 4,
    "slug": "machine-chest-press",
    "name": "Жим в грудном тренажёре",
    "nameEn": "Machine Chest Press",
    "group": "грудь",
    "images": [
      "/workout-atlas/04_1.svg",
      "/workout-atlas/04_2.svg"
    ]
  },
  {
    "id": 5,
    "slug": "dips",
    "name": "Отжимания на брусьях",
    "nameEn": "Dips",
    "group": "трицепс",
    "images": [
      "/workout-atlas/05_1.svg",
      "/workout-atlas/05_2.svg"
    ]
  },
  {
    "id": 6,
    "slug": "pull-up-wide-grip",
    "name": "Подтягивания широким хватом",
    "nameEn": "Pull-up Wide Grip",
    "group": "спина",
    "images": [
      "/workout-atlas/06_1.svg",
      "/workout-atlas/06_2.svg"
    ]
  },
  {
    "id": 7,
    "slug": "neutral-grip-pull-up",
    "name": "Подтягивания нейтральным хватом",
    "nameEn": "Neutral Grip Pull-up",
    "group": "спина",
    "images": [
      "/workout-atlas/07_1.svg",
      "/workout-atlas/07_2.svg"
    ]
  },
  {
    "id": 8,
    "slug": "lat-pulldown",
    "name": "Тяга верхнего блока",
    "nameEn": "Lat Pulldown",
    "group": "спина",
    "images": [
      "/workout-atlas/08_1.svg",
      "/workout-atlas/08_2.svg"
    ]
  },
  {
    "id": 9,
    "slug": "seated-cable-row",
    "name": "Тяга нижнего блока к животу",
    "nameEn": "Seated Cable Row",
    "group": "спина",
    "images": [
      "/workout-atlas/09_1.svg",
      "/workout-atlas/09_2.svg"
    ]
  },
  {
    "id": 10,
    "slug": "one-arm-dumbbell-row",
    "name": "Тяга гантели в наклоне",
    "nameEn": "One Arm Dumbbell Row",
    "group": "спина",
    "images": [
      "/workout-atlas/10_1.svg",
      "/workout-atlas/10_2.svg"
    ]
  },
  {
    "id": 11,
    "slug": "plate-loaded-high-row",
    "name": "Верхняя рычажная тяга Matrix",
    "nameEn": "Plate Loaded High Row",
    "group": "спина",
    "images": [
      "/workout-atlas/11_1.svg",
      "/workout-atlas/11_2.svg"
    ]
  },
  {
    "id": 12,
    "slug": "plate-loaded-row",
    "name": "Рычажная тяга Matrix",
    "nameEn": "Plate Loaded Row",
    "group": "спина",
    "images": [
      "/workout-atlas/12_1.svg",
      "/workout-atlas/12_2.svg"
    ]
  },
  {
    "id": 13,
    "slug": "straight-arm-pulldown",
    "name": "Тяга прямыми руками",
    "nameEn": "Straight Arm Pulldown",
    "group": "спина",
    "images": [
      "/workout-atlas/13_1.svg",
      "/workout-atlas/13_2.svg"
    ]
  },
  {
    "id": 14,
    "slug": "barbell-squat",
    "name": "Приседание со штангой",
    "nameEn": "Barbell Squat",
    "group": "ноги",
    "images": [
      "/workout-atlas/14_1.svg",
      "/workout-atlas/14_2.svg"
    ]
  },
  {
    "id": 15,
    "slug": "leg-press",
    "name": "Жим ногами",
    "nameEn": "Leg Press",
    "group": "ноги",
    "images": [
      "/workout-atlas/15_1.svg",
      "/workout-atlas/15_2.svg"
    ]
  },
  {
    "id": 16,
    "slug": "prone-leg-curl",
    "name": "Сгибание ног лёжа",
    "nameEn": "Prone Leg Curl",
    "group": "ноги",
    "images": [
      "/workout-atlas/16_1.svg",
      "/workout-atlas/16_2.svg"
    ]
  },
  {
    "id": 17,
    "slug": "leg-extension",
    "name": "Разгибание ног сидя",
    "nameEn": "Leg Extension",
    "group": "ноги",
    "images": [
      "/workout-atlas/17_1.svg",
      "/workout-atlas/17_2.svg"
    ]
  },
  {
    "id": 18,
    "slug": "machine-shoulder-press",
    "name": "Жим плечами в Matrix",
    "nameEn": "Machine Shoulder Press",
    "group": "плечи",
    "images": [
      "/workout-atlas/18_1.svg",
      "/workout-atlas/18_2.svg"
    ]
  },
  {
    "id": 19,
    "slug": "dumbbell-lateral-raise",
    "name": "Махи гантелями в стороны",
    "nameEn": "Dumbbell Lateral Raise",
    "group": "плечи",
    "images": [
      "/workout-atlas/19_1.svg",
      "/workout-atlas/19_2.svg"
    ]
  },
  {
    "id": 20,
    "slug": "cable-lateral-raise",
    "name": "Махи на блоке одной рукой",
    "nameEn": "Cable Lateral Raise",
    "group": "плечи",
    "images": [
      "/workout-atlas/20_1.svg",
      "/workout-atlas/20_2.svg"
    ]
  },
  {
    "id": 21,
    "slug": "reverse-pec-deck",
    "name": "Обратная бабочка",
    "nameEn": "Reverse Pec Deck",
    "group": "плечи",
    "images": [
      "/workout-atlas/21_1.svg",
      "/workout-atlas/21_2.svg"
    ]
  },
  {
    "id": 22,
    "slug": "preacher-curl",
    "name": "Сгибание на скамье Скотта",
    "nameEn": "Preacher Curl",
    "group": "бицепс",
    "images": [
      "/workout-atlas/22_1.svg",
      "/workout-atlas/22_2.svg"
    ]
  },
  {
    "id": 23,
    "slug": "alternating-dumbbell-curl",
    "name": "Попеременный подъём гантелей",
    "nameEn": "Alternating Dumbbell Curl",
    "group": "бицепс",
    "images": [
      "/workout-atlas/23_1.svg",
      "/workout-atlas/23_2.svg"
    ]
  },
  {
    "id": 24,
    "slug": "concentration-curl",
    "name": "Концентрированное сгибание",
    "nameEn": "Concentration Curl",
    "group": "бицепс",
    "images": [
      "/workout-atlas/24_1.svg",
      "/workout-atlas/24_2.svg"
    ]
  },
  {
    "id": 25,
    "slug": "incline-dumbbell-curl",
    "name": "Сгибание гантелей на наклонной",
    "nameEn": "Incline Dumbbell Curl",
    "group": "бицепс",
    "images": [
      "/workout-atlas/25_1.svg",
      "/workout-atlas/25_2.svg"
    ]
  },
  {
    "id": 26,
    "slug": "hammer-curl",
    "name": "Молотковые сгибания",
    "nameEn": "Hammer Curl",
    "group": "бицепс",
    "images": [
      "/workout-atlas/26_1.svg",
      "/workout-atlas/26_2.svg"
    ]
  },
  {
    "id": 27,
    "slug": "cable-biceps-curl",
    "name": "Сгибание на блоке",
    "nameEn": "Cable Biceps Curl",
    "group": "бицепс",
    "images": [
      "/workout-atlas/27_1.svg",
      "/workout-atlas/27_2.svg"
    ]
  },
  {
    "id": 28,
    "slug": "overhead-cable-triceps-extension",
    "name": "Разгибание из-за головы на блоке",
    "nameEn": "Overhead Cable Triceps Extension",
    "group": "трицепс",
    "images": [
      "/workout-atlas/28_1.svg",
      "/workout-atlas/28_2.svg"
    ]
  },
  {
    "id": 29,
    "slug": "cable-triceps-pushdown",
    "name": "Разгибание рук вниз на блоке",
    "nameEn": "Cable Triceps Pushdown",
    "group": "трицепс",
    "images": [
      "/workout-atlas/29_1.svg",
      "/workout-atlas/29_2.svg"
    ]
  },
  {
    "id": 30,
    "slug": "machine-triceps-extension",
    "name": "Разгибание трицепса в тренажёре",
    "nameEn": "Machine Triceps Extension",
    "group": "трицепс",
    "images": [
      "/workout-atlas/30_1.svg",
      "/workout-atlas/30_2.svg"
    ]
  },
  {
    "id": 31,
    "slug": "machine-triceps-press",
    "name": "Трицепс-пресс Matrix",
    "nameEn": "Machine Triceps Press",
    "group": "трицепс",
    "images": [
      "/workout-atlas/31_1.svg",
      "/workout-atlas/31_2.svg"
    ]
  },
  {
    "id": 32,
    "slug": "incline-bench-crunch",
    "name": "Скручивания на наклонной скамье",
    "nameEn": "Incline Bench Crunch",
    "group": "кор",
    "images": [
      "/workout-atlas/32_1.svg",
      "/workout-atlas/32_2.svg"
    ]
  },
  {
    "id": 33,
    "slug": "hanging-leg-raise",
    "name": "Подъём ног в висе",
    "nameEn": "Hanging Leg Raise",
    "group": "кор",
    "images": [
      "/workout-atlas/33_1.svg",
      "/workout-atlas/33_2.svg"
    ]
  },
  {
    "id": 34,
    "slug": "captain-chair-leg-raise",
    "name": "Подъём ног в упоре",
    "nameEn": "Captain Chair Leg Raise",
    "group": "кор",
    "images": [
      "/workout-atlas/34_1.svg",
      "/workout-atlas/34_2.svg"
    ]
  },
  {
    "id": 35,
    "slug": "bosu-crunch",
    "name": "Скручивания на BOSU",
    "nameEn": "BOSU Crunch",
    "group": "кор",
    "images": [
      "/workout-atlas/35_1.svg",
      "/workout-atlas/35_2.svg"
    ]
  },
  {
    "id": 36,
    "slug": "cable-crunch",
    "name": "Скручивания на верхнем блоке",
    "nameEn": "Cable Crunch",
    "group": "кор",
    "images": [
      "/workout-atlas/36_1.svg",
      "/workout-atlas/36_2.svg"
    ]
  },
  {
    "id": 37,
    "slug": "ab-wheel-rollout",
    "name": "Ролик для пресса",
    "nameEn": "Ab Wheel Rollout",
    "group": "кор",
    "images": [
      "/workout-atlas/37_1.svg",
      "/workout-atlas/37_2.svg"
    ]
  },
  {
    "id": 38,
    "slug": "pallof-press",
    "name": "Паллоф-пресс",
    "nameEn": "Pallof Press",
    "group": "кор",
    "images": [
      "/workout-atlas/38_1.svg",
      "/workout-atlas/38_2.svg"
    ]
  }
];
export const atlasBySlug = new Map(workoutAtlas.map(item => [item.slug, item]));
export function findAtlasExercise(nameOrSlug: string | null | undefined): AtlasExercise | undefined {
  if (!nameOrSlug) return undefined;
  const normalized = nameOrSlug.trim().toLowerCase().replace(/[^a-z0-9а-яё]+/g, '-').replace(/^-|-$/g, '');
  return workoutAtlas.find(item => item.slug === normalized
      || item.name.toLowerCase() === nameOrSlug.trim().toLowerCase()
      || item.nameEn.toLowerCase() === nameOrSlug.trim().toLowerCase());
}
