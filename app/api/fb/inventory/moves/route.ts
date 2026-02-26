import { NextResponse } from "next/server";
import { addInventoryMove, listMoves } from "@/lib/hotelDb";
export async function GET() {
  return NextResponse.json({ moves: await listMoves() });
}
export async function POST(req: Request) {
  const body = await req.json();
  if (!body.itemId || !body.qty || body.qty <= 0) return NextResponse.json({ error: "itemId and qty required" }, { status: 400 });
  const mv = await addInventoryMove(body);
  return NextResponse.json({ move: mv });
}
