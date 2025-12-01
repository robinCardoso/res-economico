'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Home, LayoutDashboard, UploadCloud, BellRing, ClipboardList, Layers3, Building, FileText, Settings2, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuthStore } from '@/stores/auth.store';
import { USER_ROLES } from '@/lib/core/roles';

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes(USER_ROLES.ADMIN) ?? false;

  // Estado para controlar quais menus estão abertos
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    if (pathname?.startsWith('/admin/resultado-economico')) {
      return ['resultado-economico'];
    }
    return [];
  });

  const toggleMenu = (menuKey: string) => {
    setOpenMenus((prev) => {
      // Se o menu já está aberto, fecha ele
      if (prev.includes(menuKey)) {
        return prev.filter((key) => key !== menuKey);
      }
      // Se está fechado, abre ele e fecha todos os outros (comportamento accordion)
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

  const resultadoEconomicoItems = [
    { label: 'Dashboard', href: '/admin/resultado-economico/dashboard', icon: LayoutDashboard },
    { label: 'Uploads', href: '/admin/resultado-economico/uploads', icon: UploadCloud },
    { label: 'Alertas', href: '/admin/resultado-economico/alertas', icon: BellRing },
    { label: 'Templates', href: '/admin/resultado-economico/templates', icon: ClipboardList },
    { label: 'Contas', href: '/admin/resultado-economico/contas', icon: Layers3 },
    { label: 'Empresas', href: '/admin/resultado-economico/empresas', icon: Building },
    { label: 'Auditoria', href: '/admin/resultado-economico/auditoria', icon: FileText },
    { label: 'Relatórios', href: '/admin/resultado-economico/relatorios', icon: FileText },
    { label: 'Configurações', href: '/admin/resultado-economico/configuracoes', icon: Settings2 },
  ];

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
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-background transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
            <Link href="/admin" className="flex items-center gap-3" onClick={onClose}>
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
                Rede União
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
            {/* Dashboard */}
            <Link
              href="/admin"
              onClick={() => {
                closeAllMenus();
                onClose();
              }}
              className={`flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive('/admin')
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                  : 'text-foreground/90 hover:bg-secondary'
              }`}
            >
              <Home className="h-4 w-4 flex-shrink-0" aria-hidden />
              <span className="whitespace-nowrap">Dashboard</span>
            </Link>

            {/* Resultado Econômico (colapsável) */}
            <Collapsible
              open={openMenus.includes('resultado-economico')}
              onOpenChange={() => toggleMenu('resultado-economico')}
            >
              <CollapsibleTrigger
                className={`w-full flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  resultadoEconomicoItems.some((item) => isActive(item.href))
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                    : 'text-foreground/90 hover:bg-secondary'
                }`}
              >
                <BarChart3 className="h-4 w-4 flex-shrink-0" aria-hidden />
                <span className="flex-1 text-left whitespace-nowrap">Resultado Econômico</span>
                {openMenus.includes('resultado-economico') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-0.5 pl-8 overflow-visible data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                {resultadoEconomicoItems.map((item) => {
                  const Icon = item.icon;
                  const itemIsActive = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        closeAllMenus();
                        onClose();
                      }}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition ${
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
          </nav>

          {/* Footer */}
          <div className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Rede União Nacional
          </div>
        </div>
      </aside>
    </>
  );
};

