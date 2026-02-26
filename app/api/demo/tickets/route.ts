import { NextResponse } from "next/server";
import { createTicket, listTickets, updateTicketStatus } from "@/lib/demoDb";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const hotelId = url.searchParams.get("hotelId") || "hotel_demo_1";
  return NextResponse.json({ tickets: await listTickets(hotelId) });
}
export async function POST(req: Request) {
  const body = await req.json();
  const ticket = await createTicket({
    hotelId: body.hotelId || "hotel_demo_1",
    guestId: body.guestId, areaId: body.areaId,
    title: body.title, description: body.description,
    status: "new", priority: body.priority || "normal",
  });
  return NextResponse.json({ ticket });
}
export async function PATCH(req: Request) {
  const { ticketId, status } = await req.json();
  if (!ticketId || !status) return NextResponse.json({ error: "ticketId and status required" }, { status: 400 });
  const ticket = await updateTicketStatus(ticketId, status);
  return NextResponse.json({ ticket });
}
