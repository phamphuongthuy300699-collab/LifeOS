import { getDictionary } from '@lifeos/i18n';

export default function InboxPage() {
  const dict = getDictionary('ru');
  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-content">{dict.inbox.title}</h1>
      <p className="mt-4 text-content-muted">{dict.inbox.empty}</p>
    </div>
  );
}
