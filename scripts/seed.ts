import { PrismaClient } from "@prisma/client";

async function seed() {
  const prisma = new PrismaClient();
  await prisma.session.create({
    data: {
      name: "HELIOS Startmission",
      status: "ACTIVE",
      modulesEnabled: ["dice", "map", "characters"],
      owner: {
        create: {
          email: "gm@example.com",
          passwordHash: "development-only",
          displayName: "Game Mother",
          roles: ["GM"],
        },
      },
    },
  });
  await prisma.$disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
