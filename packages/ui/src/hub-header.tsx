interface HubHeaderProps {
  title: string;
  description: string;
}

export function HubHeader({ title, description }: HubHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
        HELIOS Control Center
      </p>
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      <p className="text-sm text-slate-400">{description}</p>
    </header>
  );
}
