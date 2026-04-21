import { getDictionary } from '@lifeos/i18n';

export default function WorkoutPage() {
  const dict = getDictionary('ru');
  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-content">{dict.workout.title}</h1>
      <p className="mt-4 text-content-muted">Sprint 4</p>
    </div>
  );
}
