import { getDictionary } from '@lifeos/i18n';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  FolderKanban,
  Wallet,
  Download,
  Settings,
} from 'lucide-react';

const menuItems = [
  { key: 'learning' as const, href: '/learning', icon: BookOpen },
  { key: 'contacts' as const, href: '/contacts', icon: Users },
  { key: 'projects' as const, href: '/projects', icon: FolderKanban },
  { key: 'finance' as const, href: '/finance', icon: Wallet },
  { key: 'export' as const, href: '/export', icon: Download },
  { key: 'settings' as const, href: '/settings', icon: Settings },
] as const;

export default function MorePage() {
  const dict = getDictionary('ru');

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-content">{dict.nav.more}</h1>
      <div className="mt-6 space-y-1">
        {menuItems.map(({ key, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className="flex items-center gap-4 rounded-xl px-4 py-3 
                       text-content transition-colors hover:bg-surface-secondary"
          >
            <Icon size={20} className="text-content-muted" />
            <span className="text-sm font-medium">{dict.more[key]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
