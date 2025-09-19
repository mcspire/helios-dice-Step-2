import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@helios/utils/prisma";
import { createAuthTokens, hashPassword, setAuthCookies } from "@helios/utils/auth";
import type { Role } from "@helios/types/user";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const result = registerSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json({ error: "Bitte überprüfe die Eingaben" }, { status: 400 });
  }

  const { email, password, displayName } = result.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-Mail wird bereits verwendet" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const roles: Role[] = ["PLAYER"];
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      roles,
    },
  });

  const tokens = await createAuthTokens({
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    roles,
  });
  await setAuthCookies(tokens);

  return NextResponse.json(
    {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        theme: user.theme,
        roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
    { status: 201 }
  );
}
