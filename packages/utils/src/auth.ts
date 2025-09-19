import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@helios/types/user";

const textEncoder = new TextEncoder();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET ?? "insecure-access-secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET ?? "insecure-refresh-secret";
const REALTIME_TOKEN_SECRET = process.env.REALTIME_TOKEN_SECRET ?? ACCESS_TOKEN_SECRET;

const ACCESS_COOKIE = "helios.accessToken";
const REFRESH_COOKIE = "helios.refreshToken";

const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days
const REALTIME_TOKEN_TTL = 5 * 60; // 5 minutes

interface TokenPayload {
  sub: string;
  email: string;
  displayName: string;
  roles: Role[];
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedIdentity extends TokenPayload {}

async function signToken(payload: TokenPayload, secret: string, expiresInSeconds: number) {
  return new SignJWT(payload as TokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .setAudience("helios-platform")
    .setIssuer("helios-platform")
    .sign(textEncoder.encode(secret));
}

export async function createAuthTokens(payload: TokenPayload): Promise<AuthTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    signToken(payload, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL),
    signToken(payload, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_TTL),
  ]);
  return { accessToken, refreshToken };
}

export async function setAuthCookies(tokens: AuthTokens) {
  const cookieStore = cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set({
    name: ACCESS_COOKIE,
    value: tokens.accessToken,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL,
  });
  cookieStore.set({
    name: REFRESH_COOKIE,
    value: tokens.refreshToken,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_TTL,
  });
}

export async function clearAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function verifyAccessToken(token: string) {
  const result = await jwtVerify(token, textEncoder.encode(ACCESS_TOKEN_SECRET), {
    audience: "helios-platform",
    issuer: "helios-platform",
  });
  return result.payload as AuthenticatedIdentity & { exp: number; iat: number };
}

export async function verifyRefreshToken(token: string) {
  const result = await jwtVerify(token, textEncoder.encode(REFRESH_TOKEN_SECRET), {
    audience: "helios-platform",
    issuer: "helios-platform",
  });
  return result.payload as AuthenticatedIdentity & { exp: number; iat: number };
}

export async function createRealtimeToken(payload: { sessionId: string; userId: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + REALTIME_TOKEN_TTL)
    .setAudience("helios-realtime")
    .setIssuer("helios-platform")
    .sign(textEncoder.encode(REALTIME_TOKEN_SECRET));
  return { token, expiresAt: new Date(Date.now() + REALTIME_TOKEN_TTL * 1000).toISOString() };
}

export async function verifyRealtimeToken(token: string) {
  const result = await jwtVerify(token, textEncoder.encode(REALTIME_TOKEN_SECRET), {
    audience: "helios-realtime",
    issuer: "helios-platform",
  });
  return result.payload as { sessionId: string; userId: string } & { exp: number; iat: number };
}

export function hashPassword(password: string) {
  return argon2.hash(password);
}

export function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export { ACCESS_COOKIE, REFRESH_COOKIE, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL };
