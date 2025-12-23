'use client';

import { useRouter } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, List, BarChart3 } from 'lucide-react';

export default function PedidosPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie importações, visualize e analise dados de pedidos
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/admin/importacoes/pedidos/importar')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Pedidos
            </CardTitle>
            <CardDescription>
              Importe planilhas Excel com dados de pedidos
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/admin/importacoes/pedidos/gerenciar')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Gerenciar Pedidos
            </CardTitle>
            <CardDescription>
              Visualize, filtre e gerencie todos os pedidos importados
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/admin/importacoes/pedidos/analytics')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              Análises e estatísticas de pedidos por período, marca, grupo e mais
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

