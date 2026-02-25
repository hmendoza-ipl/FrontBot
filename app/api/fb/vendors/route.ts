import { NextResponse } from "next/server";
import { listVendors, createVendor } from "@/lib/hotelDb";

export async function GET() {
  return NextResponse.json({ vendors: listVendors() });
}
export async function POST(req: Request) {
  const vendor = createVendor(await req.json());
  return NextResponse.json({ vendor });
}
