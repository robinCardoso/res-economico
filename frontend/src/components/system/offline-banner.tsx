'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/http';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);

  useEffect(() => {
    // Verificar se há conexão com internet
    const checkInternet = () => {
      if (typeof navigator !== 'undefined') {
        setIsOffline(!navigator.onLine);
      }
    };

    // Verificar se o backend está acessível
    const checkBackend = async () => {
      try {
        // Usar a rota raiz do backend que retorna "Hello World!"
        // Usar timeout curto e aceitar qualquer resposta HTTP como "online"
        await api.get('/', { 
          timeout: 3000,
          validateStatus: () => true, // Aceitar qualquer resposta HTTP como "online"
        });
        setBackendOnline(true);
      } catch (error) {
        // Silenciar erros de rede - apenas marcar como offline
        // Não logar erros aqui pois é esperado quando o backend não está rodando
        setBackendOnline(false);
      }
    };

    checkInternet();
    checkBackend();

    const handleOnline = () => {
      setIsOffline(false);
      checkBackend();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar backend periodicamente quando offline
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        checkBackend();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Só mostrar se realmente estiver offline E backend não estiver acessível
  if (!isOffline || backendOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[90%] max-w-xl -translate-x-1/2 rounded-lg border border-amber-400 bg-amber-100 px-4 py-3 text-sm text-amber-900 shadow-lg sm:text-base">
      Você está offline. Novos dados serão sincronizados automaticamente quando a
      conexão voltar.
    </div>
  );
};

