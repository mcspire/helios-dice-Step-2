import { NextResponse } from "next/server";

interface Params {
  params: { id: string };
}

export async function POST(_: Request, { params }: Params) {
  return NextResponse.json({ link: `https://helios.example/invite/${params.id}` });
}
