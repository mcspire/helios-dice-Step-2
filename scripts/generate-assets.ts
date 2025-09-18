import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const outDir = join(process.cwd(), "public", "textures");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "readme.txt"), "Placeholder für generierte Assets");
