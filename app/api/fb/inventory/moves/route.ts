import { NextResponse } from "next/server";
import { addInventoryMove, listMoves } from "@/lib/hotelDb";

export async function GET() {
  return NextResponse.json({ moves: listMoves() });
}

export async function POST(req: Request) {
  const mv = addInventoryMove(await req.json());
  return NextResponse.json({ move: mv });
}
