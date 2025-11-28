'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BellRing,
  ClipboardList,
  LayoutDashboard,
  Layers3,
  Settings2,
  UploadCloud,
  Building,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

// Todos os menus (desktop)
const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Uploads', href: '/uploads', icon: UploadCloud },
  { label: 'Alertas', href: '/alertas', icon: BellRing },
  { label: 'Templates', href: '/templates', icon: ClipboardList },
  { label: 'Contas', href: '/contas', icon: Layers3 },
  { label: 'Empresas', href: '/empresas', icon: Building },
  { label: 'Auditoria', href: '/auditoria', icon: FileText },
  { label: 'Relatórios', href: '/relatorios', icon: FileText },
  { label: 'Configurações', href: '/configuracoes', icon: Settings2 },
];

// Menus visíveis em mobile (ocultar: Uploads, Alertas, Configurações)
const navItemsMobile: NavItem[] = navItems.filter(
  (item) =>
    item.href !== '/uploads' &&
    item.href !== '/alertas' &&
    item.href !== '/configuracoes'
);

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const pathname = usePathname();
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
        setSidebarOpen(true);
      }
    }
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
        navItems={navItemsMobile}
      />

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block lg:fixed lg:inset-y-0 lg:z-50 lg:w-64 lg:border-r lg:border-border lg:bg-background lg:transition-transform lg:duration-300 ${
          sidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 px-6 py-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="relative h-[52px] w-[52px] rounded-lg bg-card p-1.5 shadow-sm ring-1 ring-border">
                <Image
                  src="/minha-logo.png"
                  alt="Logo da empresa"
                  width={52}
                  height={52}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <span className="text-sm font-semibold leading-tight text-foreground">
                Resultado Econômico
              </span>
            </Link>
            <button
              onClick={toggleSidebar}
              className="hidden lg:block rounded-md p-1.5 text-foreground/80 hover:bg-secondary"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
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
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                      : 'text-foreground/90 hover:bg-secondary'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Resultado Econômico
          </div>
        </div>
      </aside>

      <div
        className={`flex flex-1 flex-col max-w-full overflow-x-hidden transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
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
                href="/dashboard"
                className="flex items-center gap-2 text-base font-semibold lg:hidden"
              >
                <div className="relative h-8 w-8 rounded-lg bg-card p-1 shadow-sm ring-1 ring-border">
                  <Image
                    src="/minha-logo.png"
                    alt="Logo da empresa"
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-foreground">Resultado Econômico</span>
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

