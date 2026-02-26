import { NextResponse } from "next/server";
import { listVendors, createVendor } from "@/lib/hotelDb";
export async function GET() {
  return NextResponse.json({ vendors: await listVendors() });
}
export async function POST(req: Request) {
  const vendor = await createVendor(await req.json());
  return NextResponse.json({ vendor });
}
