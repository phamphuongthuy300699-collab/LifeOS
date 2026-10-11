import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { workoutAtlas, findAtlasExercise } from './workout-atlas';
import { atlasCycle, getAtlasInstallPayload } from './workout-cycle';

test('all 38 atlas records have both source phase illustrations', () => {
  assert.equal(workoutAtlas.length, 38);
  assert.equal(new Set(workoutAtlas.map(item => item.slug)).size, 38);
  let count = 0;
  for (const exercise of workoutAtlas) {
    assert.equal(exercise.images.length, 2);
    for (const path of exercise.images) {
      assert.match(path, /^\/workout-atlas\/\d{2}_[12]\.svg$/);
      const xml = readFileSync(join(process.cwd(), 'public', path.slice(1)), 'utf8');
      assert.match(xml, /^<svg /);
      assert.match(xml, /viewBox="0 0 320 240"/);
      assert.doesNotMatch(xml, /<script|<foreignObject|onload=|xlink:href=/i);
      assert.ok(xml.includes(exercise.name), path);
      count++;
    }
    assert.equal(findAtlasExercise(exercise.name)?.slug, exercise.slug);
  }
  assert.equal(count, 76);
});

test('three-day workout cycle points only to known atlas exercises', () => {
  assert.equal(atlasCycle.length, 3);
  const slugs = new Set(workoutAtlas.map(item => item.slug));
  for (const plan of atlasCycle) {
    assert.ok(plan.exercises.length >= 3);
    assert.ok(plan.exercises.every(item => slugs.has(item.slug)));
  }
  const payload = getAtlasInstallPayload();
  assert.equal(payload.exercises.length, 38);
  assert.equal(payload.plans.length, 3);
  const dips = findAtlasExercise('Dips')?.slug;
  assert.ok(!atlasCycle.some(plan => plan.exercises.some(exercise => exercise.slug === dips)));
});
