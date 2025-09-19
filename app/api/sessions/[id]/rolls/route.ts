import { NextResponse } from "next/server";
import { getRollHistory, UnauthorizedError } from "@helios/utils/server";

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  try {
    const rolls = await getRollHistory(params.id, 25);
    return NextResponse.json({ sessionId: params.id, rolls });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
