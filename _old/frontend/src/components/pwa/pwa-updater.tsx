'use client';

import { useEffect, useState } from "react";
import { Workbox } from "workbox-window";
import type { WorkboxLifecycleWaitingEvent } from "workbox-window/utils/WorkboxEvent";

export const PwaUpdater = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "development"
    ) {
      return;
    }

    const wb = new Workbox("/sw.js");

    const handleWaiting = (event: WorkboxLifecycleWaitingEvent) => {
      setWaitingWorker(event.sw ?? null);
      setShowPrompt(true);
    };

    const handleExternalWaiting = (event: Event) => {
      handleWaiting(event as unknown as WorkboxLifecycleWaitingEvent);
    };

    wb.addEventListener("waiting", handleWaiting);
    (wb as unknown as EventTarget).addEventListener("externalwaiting", handleExternalWaiting);

    wb.register().catch((error) => {
      console.error("Erro ao registrar service worker", error);
    });

    return () => {
      wb.removeEventListener("waiting", handleWaiting);
      (wb as unknown as EventTarget).removeEventListener("externalwaiting", handleExternalWaiting);
    };
  }, []);

  const handleUpdate = () => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
    setShowPrompt(false);
    window.location.reload();
  };

  const handleDismiss = () => setShowPrompt(false);

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-sky-500 bg-slate-900/90 p-4 text-slate-100 shadow-xl backdrop-blur">
      <p className="text-sm">
        Nova versão disponível. Atualize para aproveitar as melhorias.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleUpdate}
          className="rounded-md bg-sky-500 px-3 py-1 text-sm font-semibold text-white shadow"
        >
          Atualizar agora
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-md border border-slate-400 px-3 py-1 text-sm text-slate-200"
        >
          Depois
        </button>
      </div>
    </div>
  );
};

