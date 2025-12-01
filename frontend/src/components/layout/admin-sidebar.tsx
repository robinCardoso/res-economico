'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  UploadCloud,
  BellRing,
  ClipboardList,
  Layers3,
  Building,
  FileText,
  Settings2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  Bell,
  FileCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuthStore } from '@/stores/auth.store';
import { USER_ROLES } from '@/lib/core/roles';

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export type NavGroup = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items: NavItem[];
};

// Menu Dashboard (link simples)
const dashboardItem: NavItem = {
  label: 'Dashboard',
  href: '/admin',
  icon: Home,
};

// Menu Resultado Econômico (colapsável)
const resultadoEconomicoGroup: NavGroup = {
  label: 'Resultado Econômico',
  icon: BarChart3,
  items: [
    { label: 'Dashboard', href: '/admin/resultado-economico/dashboard', icon: LayoutDashboard },
    { label: 'Uploads', href: '/admin/resultado-economico/uploads', icon: UploadCloud },
    { label: 'Alertas', href: '/admin/resultado-economico/alertas', icon: BellRing },
    { label: 'Templates', href: '/admin/resultado-economico/templates', icon: ClipboardList },
    { label: 'Contas', href: '/admin/resultado-economico/contas', icon: Layers3 },
    { label: 'Empresas', href: '/admin/resultado-economico/empresas', icon: Building },
    { label: 'Auditoria', href: '/admin/resultado-economico/auditoria', icon: FileText },
    { label: 'Relatórios', href: '/admin/resultado-economico/relatorios', icon: FileText },
    { label: 'Configurações', href: '/admin/resultado-economico/configuracoes', icon: Settings2 },
  ],
};

// Menu Processos (colapsável - futuro)
const processosGroup: NavGroup = {
  label: 'Processos',
  icon: ShieldCheck,
  items: [
    { label: 'Gestão de Processos', href: '/admin/processos', icon: ShieldCheck },
    { label: 'Relatórios SLA', href: '/admin/processos/relatorios-sla', icon: BarChart3 },
    { label: 'Notificações', href: '/admin/processos/notificacoes', icon: Bell },
  ],
};

// Menu Atas e Reuniões (link simples)
const atasItem: NavItem = {
  label: 'Atas e Reuniões',
  href: '/admin/atas',
  icon: FileCheck,
};

type AdminSidebarProps = {
  sidebarOpen: boolean;
  onNavClick: () => void;
};

export const AdminSidebar = ({ sidebarOpen, onNavClick }: AdminSidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes(USER_ROLES.ADMIN) ?? false;

  // Estado para controlar quais menus estão abertos
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    // Abrir automaticamente o menu "Resultado Econômico" se estivermos em uma de suas rotas
    if (pathname?.startsWith('/admin/resultado-economico')) {
      return ['resultado-economico'];
    }
    // Abrir automaticamente o menu "Processos" se estivermos em uma de suas rotas
    if (pathname?.startsWith('/admin/processos')) {
      return ['processos'];
    }
    return [];
  });

  const toggleMenu = (menuKey: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuKey) ? prev.filter((key) => key !== menuKey) : [...prev, menuKey]
    );
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/dashboard';
    }
    return pathname === href || (href !== '/admin' && pathname?.startsWith(href));
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some((item) => isActive(item.href));
  };

  return (
    <aside
      className={`hidden lg:block lg:fixed lg:inset-y-0 lg:z-50 lg:w-64 lg:border-r lg:border-border lg:bg-background lg:transition-transform lg:duration-300 ${
        sidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Header do Sidebar */}
        <div className="flex items-center justify-between gap-3 px-6 py-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="relative h-10 w-16 rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-border">
              <Image
                src="/minha-logo.png"
                alt="Logo da empresa"
                width={64}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <span className="text-sm font-semibold leading-tight text-foreground">
              Rede União
            </span>
          </Link>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {/* Dashboard */}
          <Link
            href={dashboardItem.href}
            onClick={onNavClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive(dashboardItem.href)
                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                : 'text-foreground/90 hover:bg-secondary'
            }`}
          >
            <dashboardItem.icon className="h-5 w-5" aria-hidden />
            {dashboardItem.label}
          </Link>

          {/* Resultado Econômico (colapsável) */}
          <Collapsible
            open={openMenus.includes('resultado-economico')}
            onOpenChange={() => toggleMenu('resultado-economico')}
          >
            <CollapsibleTrigger
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isGroupActive(resultadoEconomicoGroup)
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                  : 'text-foreground/90 hover:bg-secondary'
              }`}
            >
              <resultadoEconomicoGroup.icon className="h-5 w-5" aria-hidden />
              <span className="flex-1 text-left">{resultadoEconomicoGroup.label}</span>
              {openMenus.includes('resultado-economico') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-1 pl-8">
              {resultadoEconomicoGroup.items.map((item) => {
                const Icon = item.icon;
                const itemIsActive = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavClick}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      itemIsActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                        : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          {/* Processos (colapsável) - apenas para admin */}
          {isAdmin && (
            <Collapsible
              open={openMenus.includes('processos')}
              onOpenChange={() => toggleMenu('processos')}
            >
              <CollapsibleTrigger
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isGroupActive(processosGroup)
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                    : 'text-foreground/90 hover:bg-secondary'
                }`}
              >
                <processosGroup.icon className="h-5 w-5" aria-hidden />
                <span className="flex-1 text-left">{processosGroup.label}</span>
                {openMenus.includes('processos') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1 pl-8">
                {processosGroup.items.map((item) => {
                  const Icon = item.icon;
                  const itemIsActive = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavClick}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        itemIsActive
                          ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                          : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Atas e Reuniões - apenas para admin */}
          {isAdmin && (
            <Link
              href={atasItem.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(atasItem.href)
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                  : 'text-foreground/90 hover:bg-secondary'
              }`}
            >
              <atasItem.icon className="h-5 w-5" aria-hidden />
              {atasItem.label}
            </Link>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Rede União Nacional
        </div>
      </div>
    </aside>
  );
};

