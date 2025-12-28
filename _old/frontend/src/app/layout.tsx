import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from './providers';
import { OfflineBanner } from '@/components/system/offline-banner';
import { PwaUpdater } from '@/components/pwa/pwa-updater';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/layout/theme-provider';

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
    template: '%s | Rede União Nacional',
    default: 'Rede União Nacional',
  },
  description:
    'Sistema completo de gestão para a Rede União Nacional - Resultado econômico, importação de balancetes, análise inteligente e controle de alertas contábeis.',
  manifest: '/manifest.json',
  applicationName: 'Rede União Nacional',
  keywords: ['rede união nacional', 'contabilidade', 'resultado econômico', 'balancete', 'PWA', 'gestão'],
  icons: {
    icon: [
      { url: '/minha-logo.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/minha-logo.png', type: 'image/png' },
    ],
  },
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
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AppProviders>
            {children}
            <OfflineBanner />
            <PwaUpdater />
            <Toaster />
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
