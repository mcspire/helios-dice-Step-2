import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-10 shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
