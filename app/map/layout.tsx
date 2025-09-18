import { ReactNode } from "react";
import { ModuleShell } from "@helios/ui/module-shell";

export default function MapLayout({ children }: { children: ReactNode }) {
  return <ModuleShell module="map">{children}</ModuleShell>;
}
