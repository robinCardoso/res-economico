'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página index de Clientes
 * Redireciona automaticamente para Perfil de Cliente
 */
export default function ClientesIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/clientes/perfil');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
