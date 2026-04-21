import { redirect } from 'next/navigation';

/**
 * Root page — redirects to /today.
 */
export default function RootPage() {
  redirect('/today');
}
