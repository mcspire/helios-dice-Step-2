import { ReactNode } from "react";
import { ModuleShell } from "@helios/ui/module-shell";

export default function CharactersLayout({ children }: { children: ReactNode }) {
  return <ModuleShell module="characters">{children}</ModuleShell>;
}
