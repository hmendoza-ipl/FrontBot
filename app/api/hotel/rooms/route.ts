import { NextResponse } from "next/server";
import { listRooms, updateRoom, createRoom, deleteRoom, createRoomType, updateRoomType } from "@/lib/hotelDb";
export async function GET() {
  return NextResponse.json(await listRooms());
}
export async function POST(req: Request) {
  const body = await req.json();
  if (body.kind === "room") {
    const room = await createRoom(body.data);
    return NextResponse.json({ room });
  }
  if (body.kind === "roomType") {
    const roomType = await createRoomType(body.data);
    return NextResponse.json({ roomType });
  }
  return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
}
export async function PATCH(req: Request) {
  const { kind, id, patch } = await req.json();
  if (kind === "room") {
    const room = await updateRoom(id, patch);
    if (!room) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ room });
  }
  if (kind === "roomType") {
    const roomType = await updateRoomType(id, patch);
    if (!roomType) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ roomType });
  }
  return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
}
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = await deleteRoom(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
