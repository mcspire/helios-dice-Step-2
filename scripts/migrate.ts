import { execSync } from "child_process";

execSync("pnpm prisma migrate deploy", { stdio: "inherit" });
