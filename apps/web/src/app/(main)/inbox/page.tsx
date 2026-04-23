'use client';

import { getDictionary } from '@lifeos/i18n';
import { usePendingInboxItems } from '@/shared/hooks/use-inbox';
import { InboxItemCard } from '@/shared/components/inbox-item-card';

export default function InboxPage() {
  const dict = getDictionary('ru');
  const { data, isLoading, error } = usePendingInboxItems();

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-content">{dict.inbox.title}</h1>
      
      {isLoading && <p className="mt-4 text-content-muted">{dict.common.loading}</p>}
      
      {error && <p className="mt-4 text-accent">{dict.common.error}</p>}
      
      {data && data.items.length === 0 && (
        <p className="mt-4 text-content-muted">{dict.inbox.empty}</p>
      )}

      {data && data.items.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {data.items.map((item) => (
            <InboxItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
