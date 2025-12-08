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
  Package,
  List,
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

// Menu Importações (colapsável)
const importacoesGroup: NavGroup = {
  label: 'Importações',
  icon: UploadCloud,
  items: [
    { label: 'Bravo ERP - Produtos', href: '/admin/importacoes/bravo-erp/produtos', icon: Package },
    { label: 'Vendas', href: '/admin/importacoes/vendas', icon: BarChart3 },
  ],
};

// Menu Vendas (colapsável) - submenu dentro de Importações
const vendasGroup: NavGroup = {
  label: 'Vendas',
  icon: BarChart3,
  items: [
    { label: 'Importar', href: '/admin/importacoes/vendas/importar', icon: UploadCloud },
    { label: 'Gerenciar', href: '/admin/importacoes/vendas/gerenciar', icon: List },
    { label: 'Analytics', href: '/admin/importacoes/vendas/analytics', icon: BarChart3 },
  ],
};

// Menu Atas e Reuniões (link simples)
const atasItem: NavItem = {
  label: 'Atas e Reuniões',
  href: '/admin/atas',
  icon: FileCheck,
};

// Menu Configurações (link simples)
const configuracoesItem: NavItem = {
  label: 'Configurações',
  href: '/admin/configuracoes/email',
  icon: Settings2,
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
    // Abrir automaticamente o menu "Importações" se estivermos em uma de suas rotas
    if (pathname?.startsWith('/admin/importacoes')) {
      return ['importacoes', 'vendas'];
    }
    return [];
  });

  const toggleMenu = (menuKey: string) => {
    setOpenMenus((prev) => {
      // Se o menu já está aberto, fecha ele
      if (prev.includes(menuKey)) {
        return prev.filter((key) => key !== menuKey);
      }
      // Se está fechado, abre ele
      // Para submenus (como 'vendas'), manter o menu pai ('importacoes') aberto
      if (menuKey === 'vendas') {
        return [...prev.filter((key) => key !== 'vendas'), 'importacoes', 'vendas'];
      }
      // Para outros menus, fecha todos os outros (comportamento accordion)
      return [menuKey];
    });
  };

  // Função para fechar todos os menus (usado quando clica em item simples)
  const closeAllMenus = () => {
    setOpenMenus([]);
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
      className={`hidden lg:block lg:fixed lg:inset-y-0 lg:z-50 lg:w-72 lg:border-r lg:border-border lg:bg-background lg:transition-transform lg:duration-300 ${
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
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-visible px-3">
          {/* Dashboard */}
          <Link
            href={dashboardItem.href}
            onClick={() => {
              closeAllMenus();
              onNavClick();
            }}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
              isActive(dashboardItem.href)
                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                : 'text-foreground/90 hover:bg-secondary'
            }`}
          >
            <dashboardItem.icon className="h-4 w-4 flex-shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{dashboardItem.label}</span>
          </Link>

          {/* Resultado Econômico (colapsável) */}
          <Collapsible
            open={openMenus.includes('resultado-economico')}
            onOpenChange={() => toggleMenu('resultado-economico')}
          >
            <CollapsibleTrigger
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                isGroupActive(resultadoEconomicoGroup)
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                  : 'text-foreground/90 hover:bg-secondary'
              }`}
            >
              <resultadoEconomicoGroup.icon className="h-4 w-4 flex-shrink-0" aria-hidden />
              <span className="flex-1 text-left whitespace-nowrap">{resultadoEconomicoGroup.label}</span>
              {openMenus.includes('resultado-economico') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-0.5 pl-8 overflow-visible data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              {resultadoEconomicoGroup.items.map((item) => {
                const Icon = item.icon;
                const itemIsActive = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      closeAllMenus();
                      onNavClick();
                    }}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      itemIsActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                        : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">{item.label}</span>
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
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  isGroupActive(processosGroup)
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                    : 'text-foreground/90 hover:bg-secondary'
                }`}
              >
                <processosGroup.icon className="h-4 w-4 flex-shrink-0" aria-hidden />
                <span className="flex-1 text-left whitespace-nowrap">{processosGroup.label}</span>
                {openMenus.includes('processos') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-0.5 pl-8 overflow-visible data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                {processosGroup.items.map((item) => {
                  const Icon = item.icon;
                  const itemIsActive = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        closeAllMenus();
                        onNavClick();
                      }}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        itemIsActive
                          ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                          : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Importações (colapsável) - apenas para admin */}
          {isAdmin && (
            <Collapsible
              open={openMenus.includes('importacoes')}
              onOpenChange={() => toggleMenu('importacoes')}
            >
              <CollapsibleTrigger
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  isGroupActive(importacoesGroup)
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                    : 'text-foreground/90 hover:bg-secondary'
                }`}
              >
                <importacoesGroup.icon className="h-4 w-4 flex-shrink-0" aria-hidden />
                <span className="flex-1 text-left whitespace-nowrap">{importacoesGroup.label}</span>
                {openMenus.includes('importacoes') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-0.5 pl-8 overflow-visible data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                {importacoesGroup.items.map((item) => {
                  const Icon = item.icon;
                  const itemIsActive = isActive(item.href);
                  
                  // Se for o item "Vendas", renderizar como submenu colapsável
                  if (item.href === '/admin/importacoes/vendas') {
                    return (
                      <Collapsible
                        key={item.href}
                        open={openMenus.includes('vendas')}
                        onOpenChange={() => {
                          // Não fechar todos os menus, apenas alternar o submenu "Vendas"
                          toggleMenu('vendas');
                        }}
                      >
                        <CollapsibleTrigger
                          onClick={(e) => {
                            // Prevenir o comportamento padrão que fecha todos os menus
                            e.stopPropagation();
                          }}
                          className={`w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                            isGroupActive(vendasGroup)
                              ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                              : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                          <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                          {openMenus.includes('vendas') ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-0.5 space-y-0.5 pl-6 overflow-visible data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                          {vendasGroup.items.map((subItem: NavItem) => {
                            const SubIcon = subItem.icon;
                            const subItemIsActive = isActive(subItem.href);
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                onClick={() => {
                                  // Não fechar todos os menus, apenas fechar após navegação
                                  // Manter "Importações" e "Vendas" abertos durante navegação
                                  onNavClick();
                                }}
                                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                  subItemIsActive
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                                    : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                                }`}
                              >
                                <SubIcon className="h-3 w-3 flex-shrink-0" aria-hidden />
                                <span className="whitespace-nowrap">{subItem.label}</span>
                              </Link>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  }
                  
                  // Para outros itens, renderizar normalmente
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        closeAllMenus();
                        onNavClick();
                      }}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        itemIsActive
                          ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                          : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                      <span className="whitespace-nowrap">{item.label}</span>
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
              onClick={() => {
                closeAllMenus();
                onNavClick();
              }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                isActive(atasItem.href)
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                  : 'text-foreground/90 hover:bg-secondary'
              }`}
            >
              <atasItem.icon className="h-4 w-4 flex-shrink-0" aria-hidden />
              <span className="whitespace-nowrap">{atasItem.label}</span>
            </Link>
          )}

          {/* Configurações - apenas para admin */}
          {isAdmin && (
            <Link
              href={configuracoesItem.href}
              onClick={() => {
                closeAllMenus();
                onNavClick();
              }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                isActive(configuracoesItem.href) || pathname?.startsWith('/admin/configuracoes')
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                  : 'text-foreground/90 hover:bg-secondary'
              }`}
            >
              <configuracoesItem.icon className="h-4 w-4 flex-shrink-0" aria-hidden />
              <span className="whitespace-nowrap">{configuracoesItem.label}</span>
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

