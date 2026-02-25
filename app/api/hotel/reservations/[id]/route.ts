import { NextResponse } from "next/server";
import { getReservation, patchReservation } from "@/lib/hotelDb";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const reservation = getReservation(params.id);
  if (!reservation) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ reservation });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { patch } = await req.json();
  const reservation = patchReservation(params.id, patch);
  if (!reservation) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ reservation });
}
