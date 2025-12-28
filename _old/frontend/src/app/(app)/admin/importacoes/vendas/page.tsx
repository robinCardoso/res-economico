'use client';

import { useRouter } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, List, BarChart3 } from 'lucide-react';

export default function VendasPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie importações, visualize e analise dados de vendas
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/admin/importacoes/vendas/importar')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Vendas
            </CardTitle>
            <CardDescription>
              Importe planilhas Excel com dados de vendas
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/admin/importacoes/vendas/gerenciar')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Gerenciar Vendas
            </CardTitle>
            <CardDescription>
              Visualize, filtre e gerencie todas as vendas importadas
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/admin/importacoes/vendas/analytics')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              Análises e estatísticas de vendas por período, marca, grupo e mais
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
