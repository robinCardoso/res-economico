'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/components/auth/auth-guard';
import { usePathname } from 'next/navigation';

type Props = {
  children: ReactNode;
};

const AppLayout = ({ children }: Props) => {
  const pathname = usePathname();
  // Verificar se estamos em rotas admin - o layout admin já cuida do AppShell
  const isAdminRoute = pathname?.startsWith('/admin');
  // Verificar se estamos na página de relatórios/resultado
  // Se sim, não renderizar AppShell (o layout filho já cuida disso)
  const isRelatorioResultado = pathname === '/relatorios/resultado';

  // Se for rota admin ou relatório resultado, não renderizar AppShell aqui
  if (isAdminRoute || isRelatorioResultado) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
};

export default AppLayout;

