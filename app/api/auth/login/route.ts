import { NextResponse } from "next/server";
import { authenticateUser } from "@helios/utils/server";

export async function POST() {
  const user = await authenticateUser();
  return NextResponse.json({
    accessToken: `access-${user.userId}`,
    refreshToken: `refresh-${user.userId}`,
    user,
  });
}
