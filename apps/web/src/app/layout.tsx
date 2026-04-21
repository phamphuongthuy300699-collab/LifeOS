import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/providers/providers';

export const metadata: Metadata = {
  title: 'LifeOS — Personal Productivity Hub',
  description:
    'Систематизация задач, календаря, тренировок, питания, обучения и финансов в одном приложении.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f1a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
