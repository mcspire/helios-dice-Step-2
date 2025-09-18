import Link from "next/link";
import type { ModuleSummary } from "@helios/utils/module-registry";

export function ModuleTile({ module }: { module: ModuleSummary }) {
  const statusColor =
    module.status === "active" ? "text-emerald-400" : module.status === "maintenance" ? "text-amber-400" : "text-slate-400";

  return (
    <Link
      href={module.href}
      className="group relative flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-brand-light"
    >
      <span className="text-3xl" aria-hidden>
        {module.icon}
      </span>
      <div>
        <h3 className="text-lg font-semibold text-white">{module.title}</h3>
        <p className="text-sm text-slate-400">{module.description}</p>
      </div>
      <span className={`text-xs font-semibold uppercase tracking-wide ${statusColor}`}>
        {module.status === "active"
          ? "Aktiv"
          : module.status === "maintenance"
          ? "Wartung"
          : "In Vorbereitung"}
      </span>
    </Link>
  );
}
