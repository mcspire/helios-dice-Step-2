import { NextResponse } from "next/server";
import { getDicePresets } from "@helios/utils/server";

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  const rolls = await getDicePresets();
  return NextResponse.json({ sessionId: params.id, rolls });
}
