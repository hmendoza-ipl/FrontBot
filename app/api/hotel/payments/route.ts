import { NextResponse } from "next/server";
import { addPayment } from "@/lib/hotelDb";

export async function POST(req: Request) {
  const body = await req.json();
  const payment = addPayment(body);
  return NextResponse.json({ payment });
}
