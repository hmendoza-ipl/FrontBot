import { NextResponse } from "next/server";
import { listReservations, createReservation } from "@/lib/hotelDb";
export async function GET() {
  return NextResponse.json({ reservations: await listReservations() });
}
export async function POST(req: Request) {
  const body = await req.json();
  const reservation = await createReservation(body);
  return NextResponse.json({ reservation });
}
