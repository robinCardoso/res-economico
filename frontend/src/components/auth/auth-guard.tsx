'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // Aguardar a hidratação do Zustand antes de verificar autenticação
  useEffect(() => {
    if (_hasHydrated) {
      // Usar setTimeout para evitar setState síncrono no effect
      setTimeout(() => {
        setIsChecking(false);
      }, 0);
      return;
    }

    // Se ainda não hidratou, verificar diretamente no localStorage como fallback
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const auth = JSON.parse(authStorage);
          if (auth?.state?.token && auth?.state?.isAuthenticated) {
            // Estado existe no localStorage, aguardar hidratação
            // Se demorar muito (mais de 500ms), forçar verificação
            const timeout = setTimeout(() => {
              setIsChecking(false);
            }, 500);
            return () => clearTimeout(timeout);
          } else {
            // Não há token válido, considerar não autenticado
            setTimeout(() => {
              setIsChecking(false);
            }, 0);
          }
        } catch {
          // Erro ao parsear, considerar não autenticado
          setTimeout(() => {
            setIsChecking(false);
          }, 0);
        }
      } else {
        // Não há storage, considerar não autenticado
        setTimeout(() => {
          setIsChecking(false);
        }, 0);
      }
    } else {
      // Server-side, considerar não autenticado
      setTimeout(() => {
        setIsChecking(false);
      }, 0);
    }
  }, [_hasHydrated]);

  useEffect(() => {
    // Só verificar autenticação após a hidratação
    if (isChecking) return;

    // Rotas públicas que não precisam de autenticação
    const publicRoutes = ['/login'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
    } else if (isAuthenticated && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, router, isChecking]);

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Mostrar loading durante verificação ou se não estiver autenticado e não for rota pública
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-slate-500">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}

