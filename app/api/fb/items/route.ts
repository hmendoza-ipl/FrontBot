import { NextResponse } from "next/server";
import { listFBItems, createFBItem } from "@/lib/hotelDb";

export async function GET() {
  return NextResponse.json({ items: listFBItems() });
}
export async function POST(req: Request) {
  const item = createFBItem(await req.json());
  return NextResponse.json({ item });
}
