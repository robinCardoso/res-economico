import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from './providers';
import { OfflineBanner } from '@/components/system/offline-banner';
import { PwaUpdater } from '@/components/pwa/pwa-updater';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Resultado Econômico',
    default: 'Resultado Econômico',
  },
  description:
    'Aplicativo PWA para importação de balancetes, análise inteligente e controle de alertas contábeis.',
  manifest: '/manifest.json',
  applicationName: 'Resultado Econômico',
  keywords: ['contabilidade', 'resultado econômico', 'balancete', 'PWA'],
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100`}
      >
        <AppProviders>
          {children}
          <OfflineBanner />
          <PwaUpdater />
        </AppProviders>
      </body>
    </html>
  );
}
