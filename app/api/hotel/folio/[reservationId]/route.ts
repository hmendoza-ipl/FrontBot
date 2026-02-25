import { NextResponse } from "next/server";
import { listFolio, addFolioItem } from "@/lib/hotelDb";

export async function GET(_: Request, { params }: { params: { reservationId: string } }) {
  return NextResponse.json(listFolio(params.reservationId));
}

export async function POST(req: Request, { params }: { params: { reservationId: string } }) {
  const body = await req.json();
  const item = addFolioItem({ reservationId: params.reservationId, ...body });
  return NextResponse.json({ item });
}
