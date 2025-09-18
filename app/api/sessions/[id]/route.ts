import { NextResponse } from "next/server";
import { getSessionById } from "@helios/utils/server";

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  const session = await getSessionById(params.id);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function PATCH(_: Request, { params }: Params) {
  const session = await getSessionById(params.id);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}
