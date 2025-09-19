import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@helios/utils/prisma";
import { createAuthTokens, setAuthCookies, verifyPassword } from "@helios/utils/auth";
import type { Role } from "@helios/types/user";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const parseResult = loginSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Bitte prüfe deine Zugangsdaten" }, { status: 400 });
  }

  const { email, password } = parseResult.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "E-Mail oder Passwort ist falsch" }, { status: 401 });
  }

  const isValidPassword = await verifyPassword(user.passwordHash, password);
  if (!isValidPassword) {
    return NextResponse.json({ error: "E-Mail oder Passwort ist falsch" }, { status: 401 });
  }

  const roles = (user.roles ?? []) as Role[];
  const tokens = await createAuthTokens({
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    roles,
  });

  await setAuthCookies(tokens);

  return NextResponse.json({
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
  });
}
