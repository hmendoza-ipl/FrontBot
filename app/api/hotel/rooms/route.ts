import { NextResponse } from "next/server";
import { listRooms, updateRoom } from "@/lib/hotelDb";

export async function GET() {
  return NextResponse.json(listRooms());
}

export async function PATCH(req: Request) {
  const { id, patch } = await req.json();
  const room = updateRoom(id, patch);
  if (!room) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ room });
}
