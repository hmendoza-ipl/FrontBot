import { NextResponse } from "next/server";
import { getOrCreateConversation, listConversations } from "@/lib/demoDb";
export async function POST(req: Request) {
  const { hotelId, guestId } = await req.json();
  const c = await getOrCreateConversation(hotelId, guestId);
  return NextResponse.json({ conversation: c });
}
export async function GET(req: Request) {
  const url = new URL(req.url);
  const hotelId = url.searchParams.get("hotelId") || "hotel_demo_1";
  return NextResponse.json({ conversations: await listConversations(hotelId) });
}
