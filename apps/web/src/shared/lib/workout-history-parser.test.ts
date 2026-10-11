import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkoutHistoryMarkdown, parseWorkoutProfileMarkdown } from './workout-history-parser';

test('history preserves uncertain and assisted-set raw notation', () => {
  const text = '# Атлас\n> Период: 23 августа — 15 сентября 2026\n## Хронологический журнал результатов\n| Дата | Упражнение | Результат / комментарий |\n|---|---|---|\n| 31.08 | Жим лёжа | 90×7–8 (последний с помощью); 90×5 чисто |\n| 10.09 | Трицепс overhead | 20,3×12 без разведения |\n\n## Принципы';
  const rows = parseWorkoutHistoryMarkdown(text);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {date:'2026-08-31',label:'Жим лёжа',raw:'90×7–8 (последний с помощью); 90×5 чисто',slug:'barbell-bench-press'});
  assert.match(rows[1]!.raw, /20,3×12/);
});

test('invalid dates, unknown year and no table are rejected', () => {
  const start = '> Период: август 2026\n## Хронологический журнал результатов\n';
  assert.throws(() => parseWorkoutHistoryMarkdown(start+'| 31.02 | Махи | 10×12 |'),/Недопустимая/);
  assert.throws(() => parseWorkoutHistoryMarkdown('## Хронологический журнал результатов\n| 23.08 | Махи | 10×12 |'),/год/);
});

test('profile bullet lists remain private data parsed only at upload time', () => {
  const source = '## Цели и исходные данные\n- Цель: подготовка\n- Оговорка: беречь руки\n\n## Принципы прогрессии на 1–3 месяца\n- Добавлять повторы';
  assert.deepEqual(parseWorkoutProfileMarkdown(source), {
    goalsAndConstraints:['Цель: подготовка','Оговорка: беречь руки'],
    progressionRules:['Добавлять повторы'],
  });
});
