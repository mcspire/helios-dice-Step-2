import { NextResponse } from "next/server";
import { clearAuthCookies } from "@helios/utils/auth";

export async function POST() {
  await clearAuthCookies();
  return NextResponse.json({ success: true });
}
