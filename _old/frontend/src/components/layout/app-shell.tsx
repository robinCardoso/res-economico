'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Menu,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';
import { AdminSidebar } from './admin-sidebar';
import { NotificacoesLembretes } from '@/components/atas/notificacoes-lembretes';

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const router = useRouter();
  const { clearAuth, user } = useAuthStore();
  
  // Estado para controlar visibilidade do sidebar
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      // Em desktop, sempre começar aberto (ignorar localStorage se for mobile)
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        return true; // Desktop: sempre aberto por padrão
      }
      // Mobile: usar localStorage
      const saved = localStorage.getItem('sidebar-open');
      return saved !== null ? saved === 'true' : false; // Mobile: fechado por padrão
    }
    return true; // SSR: assumir desktop
  });

  // Garantir que sidebar esteja aberto em desktop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop && !sidebarOpen) {
        // Em desktop, sempre abrir o sidebar
        // Usar setTimeout para evitar setState síncrono em effect
        setTimeout(() => {
          setSidebarOpen(true);
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salvar preferência no localStorage (apenas para mobile)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 1024;
      // Só salvar no localStorage se for mobile
      if (!isDesktop) {
        localStorage.setItem('sidebar-open', String(sidebarOpen));
      }
    }
  }, [sidebarOpen]);

  // Fechar sidebar ao navegar (apenas em mobile)
  const handleNavClick = () => {
    // Em mobile, fechar o drawer ao navegar
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile Navigation */}
      <MobileNav
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Desktop Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} onNavClick={handleNavClick} />

      <div
        className={`flex flex-1 flex-col max-w-full overflow-x-hidden transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-72' : 'lg:pl-0'
        }`}
      >
        <header className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              {/* Botão hamburger - sempre visível em mobile */}
              <button
                onClick={toggleSidebar}
                className="rounded-md p-2 text-foreground/90 hover:bg-secondary lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              {/* Botão para desktop - sempre visível para abrir/fechar sidebar */}
              <button
                onClick={toggleSidebar}
                className="hidden rounded-md p-1.5 text-foreground/90 hover:bg-secondary lg:block"
                aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                <Menu className="h-5 w-5" />
              </button>
              {/* Logo e título - visível em mobile */}
              <Link
                href="/admin"
                className="flex items-center gap-2 text-base font-semibold lg:hidden"
              >
                <div className="relative h-6 w-10 rounded-lg bg-white p-1 shadow-sm ring-1 ring-border">
                  <Image
                    src="/minha-logo.png"
                    alt="Logo da empresa"
                    width={40}
                    height={24}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-foreground">Rede União</span>
              </Link>
            </div>
            {user && (
              <div className="ml-auto flex items-center gap-4">
                <div className="hidden text-right lg:block">
                  <p className="text-sm font-medium text-foreground">
                    {user.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <NotificacoesLembretes />
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted hover:border-border"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">Sair</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};

