'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página de redirecionamento
 * Redireciona automaticamente para a nova localização do Perfil de Cliente
 */
export default function PerfilClienteRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a nova localização
    router.replace('/admin/clientes/perfil');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecionando para Perfil de Cliente...</p>
      </div>
    </div>
  );
}
