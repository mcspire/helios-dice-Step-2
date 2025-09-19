import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@helios/utils/prisma";
import {
  REFRESH_COOKIE,
  createAuthTokens,
  setAuthCookies,
  verifyRefreshToken,
} from "@helios/utils/auth";
import type { Role } from "@helios/types/user";

export async function POST() {
  const refreshToken = cookies().get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "Kein Refresh-Token vorhanden" }, { status: 401 });
  }

  let payload: { sub?: string };
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch (error) {
    return NextResponse.json({ error: "Refresh-Token ungültig" }, { status: 401 });
  }

  if (!payload.sub) {
    return NextResponse.json({ error: "Refresh-Token ungültig" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    return NextResponse.json({ error: "Benutzer existiert nicht mehr" }, { status: 401 });
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
  });
}
