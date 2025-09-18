import { ReactNode } from "react";
import { DiceSidebar } from "@helios/ui/dice-sidebar";

export default function DiceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[320px_1fr] bg-slate-950 text-slate-50">
      <DiceSidebar />
      <div className="flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}
