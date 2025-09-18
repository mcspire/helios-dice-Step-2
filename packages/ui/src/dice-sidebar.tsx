import Link from "next/link";

const links = [
  { href: "/dice", label: "Spieler" },
  { href: "/dice/gm", label: "GM" },
  { href: "/", label: "Zurück zum Hub" },
];

export function DiceSidebar() {
  return (
    <aside className="flex h-full flex-col gap-6 border-r border-slate-900 bg-slate-950/80 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-light">HELIOS</p>
        <h1 className="text-2xl font-bold text-white">Dice</h1>
        <p className="text-xs text-slate-400">Realtime Würfelsimulation</p>
      </div>
      <nav className="flex flex-col gap-2 text-sm text-slate-300">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl px-3 py-2 hover:bg-slate-900/60 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto space-y-2 text-xs text-slate-500">
        <p>OBS-Modus über Einstellungen aktivieren.</p>
        <p>Hotkeys: R (Reroll), C (Clear), P (Panik).</p>
      </div>
    </aside>
  );
}
