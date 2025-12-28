'use client';

import { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Mail, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ConfiguracoesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    {
      href: '/admin/configuracoes/email',
      label: 'Envio de E-mail',
      icon: Mail,
    },
    {
      href: '/admin/configuracoes/notificacoes',
      label: 'Notificações',
      icon: Bell,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <Tabs value={pathname || ''} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.href} value={tab.href} asChild>
                <Link href={tab.href} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="mt-6">{children}</div>
    </div>
  );
}

