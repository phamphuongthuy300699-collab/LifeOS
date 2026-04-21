import { getDictionary } from '@lifeos/i18n';

/**
 * Today screen — Sprint 0 placeholder.
 * Will be replaced with aggregated view in Sprint 1-2.
 */
export default function TodayPage() {
  const dict = getDictionary('ru');

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-content">{dict.today.title}</h1>
      <p className="mt-2 text-content-secondary">
        Добро пожаловать в LifeOS. Экран будет заполнен в Sprint 1.
      </p>

      {/* Placeholder cards showing Today structure */}
      <div className="mt-6 space-y-3">
        {[
          { label: dict.today.focusBlock, emoji: '🎯' },
          { label: dict.today.topTasks, emoji: '✅' },
          { label: dict.today.events, emoji: '📅' },
          { label: dict.today.emailsRequiringAction, emoji: '📧' },
          { label: dict.today.workoutCard, emoji: '💪' },
          { label: dict.today.nutritionSummary, emoji: '🍎' },
          { label: dict.today.eveningSuggestions, emoji: '🌙' },
        ].map(({ label, emoji }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-card border border-border 
                       bg-surface-elevated p-4 transition-colors hover:border-border-strong"
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-sm font-medium text-content-secondary">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
