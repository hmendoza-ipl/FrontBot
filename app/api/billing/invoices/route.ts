import { NextResponse } from "next/server";
import { listInvoices, createInvoiceFromReservation } from "@/lib/hotelDb";

export async function GET() {
  return NextResponse.json({ invoices: await listInvoices() });
}
export async function POST(req: Request) {
  const { reservationId } = await req.json();
  const invoice = await createInvoiceFromReservation(reservationId);
  return NextResponse.json({ invoice });
}
