"use client";

import { useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
}

const emitter = new EventTarget();

export function pushToast(message: string) {
  emitter.dispatchEvent(new CustomEvent("toast", { detail: message }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setToasts((current) => [...current, { id: Date.now(), message: detail }]);
    };
    emitter.addEventListener("toast", handler);
    return () => emitter.removeEventListener("toast", handler);
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timeout = setTimeout(() => setToasts((current) => current.slice(1)), 4000);
    return () => clearTimeout(timeout);
  }, [toasts]);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="rounded-xl border border-brand-light bg-slate-950/90 px-4 py-3 text-sm text-slate-100">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
