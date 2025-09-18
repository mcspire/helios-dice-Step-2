import type { ModuleId } from "@helios/types/session";

interface ModuleSummary {
  id: ModuleId;
  title: string;
  description: string;
  status: "active" | "maintenance" | "coming-soon";
  href: string;
  icon: string;
}

const modules: ModuleSummary[] = [
  {
    id: "dice",
    title: "Dice",
    description: "Physikalisch simulierte Würfe mit Realtime-Sync",
    status: "active",
    href: "/dice",
    icon: "🎲",
  },
  {
    id: "map",
    title: "Map",
    description: "Fog-of-War, Tokens und Sichtlinien",
    status: "active",
    href: "/map",
    icon: "🗺️",
  },
  {
    id: "characters",
    title: "Characters",
    description: "Verwalte Crew, Ausrüstung und Zustände",
    status: "active",
    href: "/characters",
    icon: "👤",
  },
];

export async function getModuleSummaries(): Promise<ModuleSummary[]> {
  return modules;
}

export type { ModuleSummary };
