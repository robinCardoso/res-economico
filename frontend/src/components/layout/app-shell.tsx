'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BellRing,
  BrainCircuit,
  ClipboardList,
  LayoutDashboard,
  Layers3,
  Settings2,
  UploadCloud,
  Building,
  FileText,
} from 'lucide-react';
import type { ReactNode } from 'react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Uploads', href: '/uploads', icon: UploadCloud },
  { label: 'Alertas', href: '/alertas', icon: BellRing },
  { label: 'Templates', href: '/templates', icon: ClipboardList },
  { label: 'Contas', href: '/contas', icon: Layers3 },
  { label: 'Empresas', href: '/empresas', icon: Building },
  { label: 'Auditoria', href: '/auditoria', icon: FileText },
  { label: 'Relatórios', href: '/relatorios', icon: BrainCircuit },
  { label: 'Configurações', href: '/configuracoes', icon: Settings2 },
];

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 hidden w-64 border-r border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-6 py-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="/minha-logo.png"
                alt="Logo da empresa"
                width={40}
                height={40}
                className="h-10 w-10 rounded-md object-contain shadow-sm"
                priority
              />
              <span className="text-lg font-semibold leading-tight">
                Resultado Econômico
              </span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200'
                      : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            © {new Date().getFullYear()} Resultado Econômico
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-64 max-w-full overflow-x-hidden">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 text-base font-semibold"
              >
                <Image
                  src="/minha-logo.png"
                  alt="Logo da empresa"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-md object-contain shadow-sm"
                />
                <span>Resultado Econômico</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};

