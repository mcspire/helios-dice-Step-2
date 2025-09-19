import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const DEFAULT_SESSION_ID = "00000000-0000-0000-0000-000000000000";

async function seed() {
  const prisma = new PrismaClient();

  const passwordHash = await argon2.hash("helios-demo");

  const user = await prisma.user.upsert({
    where: { email: "gm@example.com" },
    update: { displayName: "Game Mother", roles: ["GM"], passwordHash },
    create: {
      email: "gm@example.com",
      passwordHash,
      displayName: "Game Mother",
      roles: ["GM"],
    },
  });

  const sessionExists = await prisma.session.findUnique({ where: { id: DEFAULT_SESSION_ID } });

  if (!sessionExists) {
    await prisma.session.create({
      data: {
        id: DEFAULT_SESSION_ID,
        name: "HELIOS Startmission",
        description: "Einstieg in die Dice Plattform",
        status: "ACTIVE",
        modulesEnabled: ["dice", "map", "characters"],
        ownerId: user.id,
        participants: {
          create: [{ userId: user.id, role: "GM" }],
        },
        mapState: {
          create: {
            stateJson: {
              backgroundUrl: null,
              layers: [
                { id: "base", name: "Basis", visible: true, opacity: 1 },
                { id: "fog", name: "Nebel", visible: true, opacity: 0.85 },
              ],
              tokens: [
                { id: "alpha", label: "Squad Alpha", x: 12, y: 8, layerId: "base" },
              ],
            },
          },
        },
        characters: {
          create: [
            {
              ownerId: user.id,
              name: "Ellen Ripley",
              role: "PLAYER",
              attributesJson: [
                { name: "Stamina", value: 4 },
                { name: "Wits", value: 3 },
              ],
              inventoryJson: [
                { id: "pistol", name: "Service Pistol", quantity: 1 },
                { id: "motion", name: "Motion Tracker", quantity: 1 },
              ],
              status: "healthy",
            },
          ],
        },
      },
    });
  }

  await prisma.dicePreset.upsert({
    where: {
      sessionId_userId_comment: {
        sessionId: DEFAULT_SESSION_ID,
        userId: user.id,
        comment: "Standardwurf",
      },
    },
    update: {
      pool: { attribute: 3, skill: 2, bonus: 0, stress: 1, special: 0 },
    },
    create: {
      sessionId: DEFAULT_SESSION_ID,
      userId: user.id,
      comment: "Standardwurf",
      pool: { attribute: 3, skill: 2, bonus: 0, stress: 1, special: 0 },
    },
  });

  await prisma.$disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
