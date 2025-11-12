'use client';

import Link from 'next/link';
import { WifiOff } from 'lucide-react';

const OfflinePage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-slate-100">
      <WifiOff className="h-16 w-16 text-sky-400" aria-hidden />
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Sem conexão</h1>
        <p className="mt-2 max-w-md text-sm text-slate-300 sm:text-base">
          Você está offline. Os dados disponíveis são os últimos sincronizados.
          Assim que a conexão for restabelecida, a aplicação atualizará
          automaticamente.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
      >
        Tentar novamente
      </Link>
    </main>
  );
};

export default OfflinePage;

