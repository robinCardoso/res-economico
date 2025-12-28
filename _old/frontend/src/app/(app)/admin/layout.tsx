'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/components/auth/auth-guard';
import { usePathname } from 'next/navigation';

type Props = {
  children: ReactNode;
};

const AdminLayout = ({ children }: Props) => {
  const pathname = usePathname();
  // Verificar se estamos na página de relatórios/resultado
  // Se sim, não renderizar AppShell (o layout filho já cuida disso)
  const isRelatorioResultado = pathname === '/admin/resultado-economico/relatorios/resultado';

  return (
    <AuthGuard>
      {isRelatorioResultado ? children : <AppShell>{children}</AppShell>}
    </AuthGuard>
  );
};

export default AdminLayout;

