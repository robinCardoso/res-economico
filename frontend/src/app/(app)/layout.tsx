import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/components/auth/auth-guard';

type Props = {
  children: ReactNode;
};

const AppLayout = ({ children }: Props) => {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
};

export default AppLayout;

