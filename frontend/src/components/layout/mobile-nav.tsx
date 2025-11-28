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
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-background transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
              <div className="relative h-8 w-12 rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-border">
                <Image
                  src="/minha-logo.png"
                  alt="Logo da empresa"
                  width={48}
                  height={32}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <span className="text-sm font-semibold leading-tight text-foreground">
                Resultado Econômico
              </span>
            </Link>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-foreground/90 hover:bg-secondary"
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
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                      : 'text-foreground/90 hover:bg-secondary'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Resultado Econômico
          </div>
        </div>
      </aside>
    </>
  );
};

