import { NextResponse } from "next/server";
import { addPayment } from "@/lib/hotelDb";
export async function POST(req: Request) {
  const payment = await addPayment(await req.json());
  return NextResponse.json({ payment });
}
