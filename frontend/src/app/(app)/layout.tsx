import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';

type Props = {
  children: ReactNode;
};

const AppLayout = ({ children }: Props) => {
  return <AppShell>{children}</AppShell>;
};

export default AppLayout;

