'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import type { NavItem } from './app-shell';

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
};

export const MobileNav = ({ isOpen, onClose, navItems }: MobileNavProps) => {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white/95 backdrop-blur transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900/95 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
              <Image
                src="/minha-logo.png"
                alt="Logo da empresa"
                width={40}
                height={40}
                className="h-10 w-10 rounded-md object-contain shadow-sm"
                priority
              />
              <span className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
                Resultado Econômico
              </span>
            </Link>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800/80"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200'
                      : 'text-slate-700 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            © {new Date().getFullYear()} Resultado Econômico
          </div>
        </div>
      </aside>
    </>
  );
};

