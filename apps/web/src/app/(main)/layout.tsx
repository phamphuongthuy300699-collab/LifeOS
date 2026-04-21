import { BottomNav } from '@/shared/components/bottom-nav';

/**
 * Main authenticated layout — wraps all (main)/* routes.
 * Contains bottom navigation bar.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Page content — expands to fill space above nav */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom navigation — fixed */}
      <BottomNav />
    </div>
  );
}
