'use client';

import { useEffect, useState } from 'react';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(
    () => (typeof navigator !== 'undefined' ? !navigator.onLine : false),
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[90%] max-w-xl -translate-x-1/2 rounded-lg border border-amber-400 bg-amber-100 px-4 py-3 text-sm text-amber-900 shadow-lg sm:text-base">
      Você está offline. Novos dados serão sincronizados automaticamente quando a
      conexão voltar.
    </div>
  );
};

